package dashboard

import (
	"time"

	"gorm.io/gorm"
	"turnero/internal/bookings"
)

// MonthStats aggregates the current month's data.
type MonthStats struct {
	MonthRevenue   float64 `json:"month_revenue"`
	ConfirmedCount int64   `json:"confirmed_count"`
	CancelledCount int64   `json:"cancelled_count"`
	PendingCount   int64   `json:"pending_count"`
}

type Repository struct{ db *gorm.DB }

// NewRepository inicializa el repositorio de estadísticas con la conexión a la base de datos.
func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

// GetMonthStats calcula la recaudación (solo confirmados) y conteos mensuales según la regla de negocio.
func (r *Repository) GetMonthStats() (*MonthStats, error) {
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, 0)

	stats := &MonthStats{}

	// Revenue: SUM of CONFIRMED bookings only (RN #7)
	var revenue float64
	r.db.Model(&bookings.Booking{}).
		Select("COALESCE(SUM(price_at_booking), 0)").
		Where("status = ? AND created_at >= ? AND created_at < ?", bookings.StatusConfirmed, start, end).
		Scan(&revenue)
	stats.MonthRevenue = revenue

	r.db.Model(&bookings.Booking{}).
		Where("status = ? AND created_at >= ? AND created_at < ?", bookings.StatusConfirmed, start, end).
		Count(&stats.ConfirmedCount)
	r.db.Model(&bookings.Booking{}).
		Where("status = ? AND created_at >= ? AND created_at < ?", bookings.StatusCancelled, start, end).
		Count(&stats.CancelledCount)
	r.db.Model(&bookings.Booking{}).
		Where("status = ? AND created_at >= ? AND created_at < ?", bookings.StatusPending, start, end).
		Count(&stats.PendingCount)

	return stats, nil
}
