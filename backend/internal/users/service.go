package users

import "github.com/google/uuid"

type Service struct{ repo *Repository }

// NewService crea una instancia del servicio de usuarios con su repositorio.
func NewService(repo *Repository) *Service { return &Service{repo: repo} }

// GetAll retorna la lista de todos los usuarios registrados.
func (s *Service) GetAll() ([]User, error)             { return s.repo.FindAll() }

// GetByID busca y retorna un usuario según su identificador único.
func (s *Service) GetByID(id uuid.UUID) (*User, error) { return s.repo.FindByID(id) }
