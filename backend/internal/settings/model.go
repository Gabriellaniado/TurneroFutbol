package settings

import "time"

// Settings holds global config. Only one row ever exists (id=1).
type Settings struct {
	ID                  uint      `json:"id" gorm:"primaryKey"`
	BasePrice           float64   `json:"base_price" gorm:"not null;default:5000"`
	OpenTime            string    `json:"open_time" gorm:"not null;default:'08:00'"`
	CloseTime           string    `json:"close_time" gorm:"not null;default:'22:00'"`
	SlotDurationMinutes int       `json:"slot_duration_minutes" gorm:"not null;default:60"`
	UpdatedAt           time.Time `json:"updated_at"`
}
