package courts

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct{ db *gorm.DB }

// NewRepository inicializa el repositorio de canchas respaldado por GORM.
func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

// FindAll consulta todas las canchas que se encuentran en estado activo.
func (r *Repository) FindAll() ([]Court, error) {
	var cs []Court
	return cs, r.db.Where("is_active = ?", true).Order("name").Find(&cs).Error
}

// FindByID busca una cancha por su identificador único.
func (r *Repository) FindByID(id uuid.UUID) (*Court, error) {
	var c Court
	return &c, r.db.First(&c, "id = ?", id).Error
}

// Create inserta un nuevo registro de cancha en la base de datos.
func (r *Repository) Create(c *Court) error  { return r.db.Create(c).Error }

// Update guarda los cambios de una cancha existente en la base de datos.
func (r *Repository) Update(c *Court) error  { return r.db.Save(c).Error }

// SoftDelete marca la cancha como inactiva sin eliminarla físicamente del registro.
func (r *Repository) SoftDelete(id uuid.UUID) error {
	return r.db.Model(&Court{}).Where("id = ?", id).Update("is_active", false).Error
}
