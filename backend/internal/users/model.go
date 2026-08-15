package users

import (
	"time"

	"github.com/google/uuid"
)

const (
	RoleAdmin  = "ADMIN"
	RoleClient = "CLIENT"
)

// User representa la entidad de usuario del sistema con credenciales y rol.
type User struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name         string    `json:"name" gorm:"not null"`
	Email        string    `json:"email" gorm:"uniqueIndex;not null"`
	PasswordHash string    `json:"-" gorm:"not null"`
	Role         string    `json:"role" gorm:"not null;default:'CLIENT'"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
