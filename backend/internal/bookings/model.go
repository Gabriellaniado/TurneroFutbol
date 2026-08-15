package bookings

import (
	"time"

	"github.com/google/uuid"
	"turnero/internal/courts"
	"turnero/internal/users"
)

const (
	StatusPending   = "PENDIENTE"
	StatusConfirmed = "CONFIRMADO"
	StatusCancelled = "CANCELADO"
)

// Booking representa una reserva de turno con sus datos de horario, precio y relaciones.
type Booking struct {
	ID             uuid.UUID    `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID         uuid.UUID    `json:"user_id" gorm:"type:uuid;not null"`
	CourtID        uuid.UUID    `json:"court_id" gorm:"type:uuid;not null"`
	TeamName       string       `json:"team_name" gorm:"not null"`
	StartTime      time.Time    `json:"start_time" gorm:"not null"`
	EndTime        time.Time    `json:"end_time" gorm:"not null"`
	PriceAtBooking float64      `json:"price_at_booking" gorm:"not null"`
	Status         string       `json:"status" gorm:"not null;default:'PENDIENTE'"`
	User           users.User   `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Court          courts.Court `json:"court,omitempty" gorm:"foreignKey:CourtID"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}
