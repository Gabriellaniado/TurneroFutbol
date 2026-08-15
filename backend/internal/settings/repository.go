package settings

import "gorm.io/gorm"

type Repository struct{ db *gorm.DB }

// NewRepository crea un repositorio para acceder a la tabla de configuración.
func NewRepository(db *gorm.DB) *Repository { return &Repository{db: db} }

// Get obtiene el registro único (singleton ID=1) de configuración del sistema.
func (r *Repository) Get() (*Settings, error) {
	var s Settings
	return &s, r.db.First(&s, 1).Error
}

// Update guarda los cambios de configuración en la base de datos.
func (r *Repository) Update(s *Settings) error { return r.db.Save(s).Error }
