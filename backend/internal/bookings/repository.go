package bookings

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BookingRepository is the interface used by Service (enables mocking in tests).
type BookingRepository interface {
	Create(b *Booking) error
	FindByID(id uuid.UUID) (*Booking, error)
	FindAll() ([]Booking, error)
	FindMyFuture(userID uuid.UUID) ([]Booking, error)
	FindByCourt(courtID uuid.UUID, dateUTC time.Time) ([]Booking, error)
	HasOverlap(courtID uuid.UUID, start, end time.Time, excludeID *uuid.UUID) (bool, error)
	Update(b *Booking) error
}

// GORMBookingRepository is the GORM-backed implementation.
type GORMBookingRepository struct{ db *gorm.DB }

// NewRepository inicializa el repositorio de reservas respaldado por GORM.
func NewRepository(db *gorm.DB) *GORMBookingRepository {
	return &GORMBookingRepository{db: db}
}

// Create inserta un nuevo registro de reserva en la base de datos.
func (r *GORMBookingRepository) Create(b *Booking) error { return r.db.Create(b).Error }

// FindByID busca una reserva por su ID cargando las relaciones de usuario y cancha.
func (r *GORMBookingRepository) FindByID(id uuid.UUID) (*Booking, error) {
	var b Booking
	err := r.db.Preload("User").Preload("Court").First(&b, "id = ?", id).Error
	return &b, err
}

// FindAll obtiene todas las reservas ordenadas descendentemente por hora de inicio.
func (r *GORMBookingRepository) FindAll() ([]Booking, error) {
	var bs []Booking
	err := r.db.Preload("User").Preload("Court").Order("start_time desc").Find(&bs).Error
	return bs, err
}

// FindMyFuture obtiene las reservas activas y futuras de un usuario en particular.
func (r *GORMBookingRepository) FindMyFuture(userID uuid.UUID) ([]Booking, error) {
	var bs []Booking
	err := r.db.Preload("Court").
		Where("user_id = ? AND start_time > ? AND status != ?", userID, time.Now(), StatusCancelled).
		Order("start_time asc").Find(&bs).Error
	return bs, err
}

// FindByCourt obtiene las reservas no canceladas de una cancha en un día específico.
func (r *GORMBookingRepository) FindByCourt(courtID uuid.UUID, dateUTC time.Time) ([]Booking, error) {
	var bs []Booking
	dayStart := time.Date(dateUTC.Year(), dateUTC.Month(), dateUTC.Day(), 0, 0, 0, 0, time.UTC)
	dayEnd := dayStart.Add(24 * time.Hour)
	err := r.db.Where(
		"court_id = ? AND status != ? AND start_time >= ? AND start_time < ?",
		courtID, StatusCancelled, dayStart, dayEnd,
	).Find(&bs).Error
	return bs, err
}

// HasOverlap verifica si existe alguna reserva activa superpuesta en el mismo rango horario y cancha.
func (r *GORMBookingRepository) HasOverlap(courtID uuid.UUID, start, end time.Time, excludeID *uuid.UUID) (bool, error) {
	q := r.db.Model(&Booking{}).Where(
		"court_id = ? AND status != ? AND start_time < ? AND end_time > ?",
		courtID, StatusCancelled, end, start,
	)
	if excludeID != nil {
		q = q.Where("id != ?", *excludeID)
	}
	var count int64
	return count > 0, q.Count(&count).Error
}

// Update actualiza los campos modificados de una reserva en la base de datos.
func (r *GORMBookingRepository) Update(b *Booking) error { return r.db.Save(b).Error }
