package dashboard

type Service struct{ repo *Repository }

// NewService crea una instancia del servicio de métricas con su repositorio.
func NewService(repo *Repository) *Service { return &Service{repo: repo} }

// GetStats delega al repositorio la consulta de métricas mensuales consolidadas.
func (s *Service) GetStats() (*MonthStats, error) { return s.repo.GetMonthStats() }
