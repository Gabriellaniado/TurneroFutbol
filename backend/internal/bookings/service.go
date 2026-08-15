package bookings

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"turnero/internal/settings"
)

// settingsGetter is what the service needs from settings — avoids tight coupling.
type settingsGetter interface {
	Get() (*settings.Settings, error)
}

// TimeSlot is a calendar slot with availability flag.
type TimeSlot struct {
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	Available bool      `json:"available"`
}

type CreateRequest struct {
	CourtID   uuid.UUID `json:"court_id" binding:"required"`
	TeamName  string    `json:"team_name" binding:"required"`
	StartTime time.Time `json:"start_time" binding:"required"`
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type Service struct {
	repo         BookingRepository
	settingsRepo settingsGetter
}

// NewService instancia el servicio de reservas con sus dependencias de datos y configuración.
func NewService(repo BookingRepository, settingsRepo settingsGetter) *Service {
	return &Service{repo: repo, settingsRepo: settingsRepo}
}

// Create enforces RN #1 (overlap), RN #2 (operating hours), RN #3 (no past).
func (s *Service) Create(req CreateRequest, userID uuid.UUID) (*Booking, error) {
	sett, err := s.settingsRepo.Get()
	if err != nil {
		return nil, errors.New("no se pudo obtener la configuración")
	}
	endTime := req.StartTime.Add(time.Duration(sett.SlotDurationMinutes) * time.Minute)

	// RN #3 — No past bookings
	if !req.StartTime.After(time.Now()) {
		return nil, errors.New("no se pueden crear reservas en el pasado")
	}

	// RN #2 — Operating hours (evaluated in Argentina timezone)
	loc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")
	localStart := req.StartTime.In(loc)
	localEnd := endTime.In(loc)
	dateStr := localStart.Format("2006-01-02")
	openT, err := time.ParseInLocation("2006-01-02 15:04", dateStr+" "+sett.OpenTime, loc)
	if err != nil {
		return nil, errors.New("horario de apertura inválido en configuración")
	}
	closeT, err := time.ParseInLocation("2006-01-02 15:04", dateStr+" "+sett.CloseTime, loc)
	if err != nil {
		return nil, errors.New("horario de cierre inválido en configuración")
	}
	if localStart.Before(openT) || localEnd.After(closeT) {
		return nil, fmt.Errorf("turno fuera del horario operativo (%s–%s)", sett.OpenTime, sett.CloseTime)
	}

	// RN #1 — Overlap
	overlap, err := s.repo.HasOverlap(req.CourtID, req.StartTime, endTime, nil)
	if err != nil {
		return nil, err
	}
	if overlap {
		return nil, errors.New("ese horario ya está ocupado en esta cancha")
	}

	b := &Booking{
		ID:             uuid.New(),
		UserID:         userID,
		CourtID:        req.CourtID,
		TeamName:       req.TeamName,
		StartTime:      req.StartTime,
		EndTime:        endTime,
		PriceAtBooking: sett.BasePrice,
		Status:         StatusPending,
	}
	return b, s.repo.Create(b)
}

// GetAll retorna todas las reservas de la base de datos ordenadas por fecha.
func (s *Service) GetAll() ([]Booking, error)                        { return s.repo.FindAll() }

// GetMyFuture retorna únicamente las reservas futuras no canceladas del usuario.
func (s *Service) GetMyFuture(userID uuid.UUID) ([]Booking, error)   { return s.repo.FindMyFuture(userID) }

// GetAvailability returns all time slots for a court+date with availability.
func (s *Service) GetAvailability(courtID uuid.UUID, dateStr string) ([]TimeSlot, error) {
	sett, err := s.settingsRepo.Get()
	if err != nil {
		return nil, err
	}
	loc, _ := time.LoadLocation("America/Argentina/Buenos_Aires")
	openT, err := time.ParseInLocation("2006-01-02 15:04", dateStr+" "+sett.OpenTime, loc)
	if err != nil {
		return nil, errors.New("fecha o formato de hora inválido")
	}
	closeT, err := time.ParseInLocation("2006-01-02 15:04", dateStr+" "+sett.CloseTime, loc)
	if err != nil {
		return nil, errors.New("fecha o formato de hora inválido")
	}

	existing, err := s.repo.FindByCourt(courtID, openT.UTC())
	if err != nil {
		return nil, err
	}

	dur := time.Duration(sett.SlotDurationMinutes) * time.Minute
	var slots []TimeSlot
	for t := openT; !t.Add(dur).After(closeT); t = t.Add(dur) {
		end := t.Add(dur)
		slot := TimeSlot{StartTime: t.UTC(), EndTime: end.UTC(), Available: true}
		for _, b := range existing {
			if b.StartTime.Before(end.UTC()) && b.EndTime.After(t.UTC()) {
				slot.Available = false
				break
			}
		}
		slots = append(slots, slot)
	}
	return slots, nil
}

// UpdateStatus enforces RN #4 — strict state machine.
func (s *Service) UpdateStatus(id uuid.UUID, newStatus string) (*Booking, error) {
	b, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("reserva no encontrada")
	}
	if !validTransition(b.Status, newStatus) {
		return nil, fmt.Errorf("transición inválida: %s → %s", b.Status, newStatus)
	}
	b.Status = newStatus
	return b, s.repo.Update(b)
}

// CancelMy lets a client cancel their own PENDIENTE booking.
func (s *Service) CancelMy(bookingID, userID uuid.UUID) (*Booking, error) {
	b, err := s.repo.FindByID(bookingID)
	if err != nil {
		return nil, errors.New("reserva no encontrada")
	}
	if b.UserID != userID {
		return nil, errors.New("no tenés permiso para cancelar esta reserva")
	}
	if b.Status != StatusPending {
		return nil, errors.New("solo podés cancelar reservas PENDIENTES")
	}
	b.Status = StatusCancelled
	return b, s.repo.Update(b)
}

// validTransition verifica si la transición entre dos estados de una reserva es válida según la máquina de estados.
func validTransition(from, to string) bool {
	allowed := map[string][]string{
		StatusPending:   {StatusConfirmed, StatusCancelled},
		StatusConfirmed: {StatusCancelled},
		StatusCancelled: {},
	}
	for _, v := range allowed[from] {
		if v == to {
			return true
		}
	}
	return false
}
