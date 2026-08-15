package settings

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct{ svc *Service }

// NewHandler crea una nueva instancia del handler HTTP para configuración general del sistema.
func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// Get retorna los valores actuales de configuración global (precios y horarios).
func (h *Handler) Get(c *gin.Context) {
	s, err := h.svc.Get()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, s)
}

// Update actualiza la configuración global del establecimiento (precio base, horarios y duración).
func (h *Handler) Update(c *gin.Context) {
	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	s, err := h.svc.Update(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, s)
}
