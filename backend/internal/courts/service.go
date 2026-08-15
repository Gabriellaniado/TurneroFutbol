package courts

import "github.com/google/uuid"

type CreateRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type UpdateRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active"`
}

type Service struct{ repo *Repository }

// NewService crea una instancia del servicio de canchas con su repositorio asociado.
func NewService(repo *Repository) *Service { return &Service{repo: repo} }

// GetAll retorna todas las canchas activas en el sistema.
func (s *Service) GetAll() ([]Court, error) { return s.repo.FindAll() }

// Create crea una nueva cancha activa con identificador único.
func (s *Service) Create(req CreateRequest) (*Court, error) {
	c := &Court{ID: uuid.New(), Name: req.Name, Description: req.Description, IsActive: true}
	return c, s.repo.Create(c)
}

// Update actualiza la información y estado de una cancha existente.
func (s *Service) Update(id uuid.UUID, req UpdateRequest) (*Court, error) {
	c, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	c.Name = req.Name
	c.Description = req.Description
	c.IsActive = req.IsActive
	return c, s.repo.Update(c)
}

// Delete realiza el borrado lógico de una cancha por su identificador.
func (s *Service) Delete(id uuid.UUID) error { return s.repo.SoftDelete(id) }
