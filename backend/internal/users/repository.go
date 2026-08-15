package users

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct{ db *gorm.DB }

// NewRepository inicializa el repositorio de usuarios con GORM.
func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

// FindByEmail busca un usuario a partir de su dirección de correo electrónico.
func (r *Repository) FindByEmail(email string) (*User, error) {
	var u User
	return &u, r.db.Where("email = ?", email).First(&u).Error
}

// FindByID busca un usuario por su identificador UUID.
func (r *Repository) FindByID(id uuid.UUID) (*User, error) {
	var u User
	return &u, r.db.First(&u, "id = ?", id).Error
}

// Create inserta un nuevo usuario en la base de datos.
func (r *Repository) Create(u *User) error { return r.db.Create(u).Error }

// FindAll obtiene todos los usuarios ordenados por fecha de creación descendente.
func (r *Repository) FindAll() ([]User, error) {
	var us []User
	return us, r.db.Order("created_at desc").Find(&us).Error
}
