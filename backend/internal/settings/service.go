package settings

type UpdateRequest struct {
	BasePrice           float64 `json:"base_price" binding:"required,gt=0"`
	OpenTime            string  `json:"open_time" binding:"required"`
	CloseTime           string  `json:"close_time" binding:"required"`
	SlotDurationMinutes int     `json:"slot_duration_minutes" binding:"required,min=30"`
}

type Service struct{ repo *Repository }

// NewService crea una instancia del servicio de configuración con su repositorio.
func NewService(repo *Repository) *Service { return &Service{repo: repo} }

// Get obtiene la configuración general del establecimiento.
func (s *Service) Get() (*Settings, error) { return s.repo.Get() }

// Update valida y modifica la configuración general (precio base, horarios y duración del turno).
func (s *Service) Update(req UpdateRequest) (*Settings, error) {
	sett, err := s.repo.Get()
	if err != nil {
		return nil, err
	}
	sett.BasePrice = req.BasePrice
	sett.OpenTime = req.OpenTime
	sett.CloseTime = req.CloseTime
	sett.SlotDurationMinutes = req.SlotDurationMinutes
	return sett, s.repo.Update(sett)
}
