package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"turnero/internal/auth"
	"turnero/internal/bookings"
	"turnero/internal/courts"
	"turnero/internal/dashboard"
	"turnero/internal/middleware"
	"turnero/internal/settings"
	"turnero/internal/users"
)

// main inicia el servidor: carga variables de entorno, conecta a la BD, ejecuta migraciones y registra las rutas.
func main() {
	// Intentamos cargar el .env (no importa si falla, por ej en Docker Compose)
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=America/Argentina/Buenos_Aires",
		env("DB_HOST", "localhost"), env("DB_USER", "turnero_user"),
		env("DB_PASSWORD", "password123"), env("DB_NAME", "turnero_db"), env("DB_PORT", "5432"),
	)

	// Retry DB connection (important when started with Docker Compose)
	var db *gorm.DB
	var err error
	for i := 0; i < 15; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			if sqlDB, e := db.DB(); e == nil {
				if e2 := sqlDB.Ping(); e2 == nil {
					break
				}
			}
		}
		log.Printf("DB no disponible, reintentando (%d/15)...", i+1)
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		log.Fatal("No se pudo conectar a la base de datos:", err)
	}
	log.Println("✓ PostgreSQL conectado")

	// Auto-migrate all models
	if err := db.AutoMigrate(
		&users.User{}, &courts.Court{}, &settings.Settings{}, &bookings.Booking{},
	); err != nil {
		log.Fatal("Error en migración:", err)
	}
	log.Println("✓ Migraciones aplicadas")

	// Seed default settings (singleton id=1)
	var cnt int64
	db.Model(&settings.Settings{}).Count(&cnt)
	if cnt == 0 {
		db.Create(&settings.Settings{ID: 1, BasePrice: 5000, OpenTime: "08:00", CloseTime: "22:00", SlotDurationMinutes: 60})
		log.Println("✓ Configuración inicial creada")
	}

	// Seed default admin user
	db.Model(&users.User{}).Where("role = ?", users.RoleAdmin).Count(&cnt)
	if cnt == 0 {
		hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		db.Create(&users.User{ID: uuid.New(), Name: "Administrador", Email: "admin@turnero.com", PasswordHash: string(hash), Role: users.RoleAdmin})
		log.Println("✓ Admin creado: admin@turnero.com / admin123")
	}

	jwtSecret := env("JWT_SECRET", "supersecret")

	// Wire up layers
	userRepo     := users.NewRepository(db)
	courtRepo    := courts.NewRepository(db)
	settingsRepo := settings.NewRepository(db)
	bookingRepo  := bookings.NewRepository(db)
	dashRepo     := dashboard.NewRepository(db)

	authSvc      := auth.NewService(userRepo, jwtSecret)
	userSvc      := users.NewService(userRepo)
	courtSvc     := courts.NewService(courtRepo)
	settingsSvc  := settings.NewService(settingsRepo)
	bookingSvc   := bookings.NewService(bookingRepo, settingsRepo)
	dashSvc      := dashboard.NewService(dashRepo)

	authH     := auth.NewHandler(authSvc)
	userH     := users.NewHandler(userSvc)
	courtH    := courts.NewHandler(courtSvc)
	settingsH := settings.NewHandler(settingsSvc)
	bookingH  := bookings.NewHandler(bookingSvc)
	dashH     := dashboard.NewHandler(dashSvc)

	r := gin.Default()
	r.Use(middleware.CORS())

	api := r.Group("/api")

	// Public
	api.POST("/auth/register", authH.Register)
	api.POST("/auth/login", authH.Login)

	// Authenticated
	p := api.Group("", middleware.Auth(jwtSecret))

	p.GET("/users",   middleware.RequireRole(users.RoleAdmin), userH.List)

	p.GET("/courts",       courtH.List)
	p.POST("/courts",      middleware.RequireRole(users.RoleAdmin), courtH.Create)
	p.PUT("/courts/:id",   middleware.RequireRole(users.RoleAdmin), courtH.Update)
	p.DELETE("/courts/:id",middleware.RequireRole(users.RoleAdmin), courtH.Delete)

	p.GET("/bookings",              middleware.RequireRole(users.RoleAdmin),  bookingH.ListAll)
	p.GET("/bookings/my",           middleware.RequireRole(users.RoleClient), bookingH.ListMy)
	p.GET("/bookings/availability", bookingH.GetAvailability)
	p.POST("/bookings",             middleware.RequireRole(users.RoleClient), bookingH.Create)
	p.PATCH("/bookings/:id/status", middleware.RequireRole(users.RoleAdmin),  bookingH.UpdateStatus)
	p.PATCH("/bookings/:id/cancel", middleware.RequireRole(users.RoleClient), bookingH.CancelMy)

	p.GET("/settings",  settingsH.Get)
	p.PUT("/settings",  middleware.RequireRole(users.RoleAdmin), settingsH.Update)

	p.GET("/dashboard/stats", middleware.RequireRole(users.RoleAdmin), dashH.GetStats)

	port := env("PORT", "8080")
	log.Printf("🚀 Servidor en :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

// env obtiene el valor de una variable de entorno o retorna el valor fallback por defecto.
func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
