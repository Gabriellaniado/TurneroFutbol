package dashboard

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct{ svc *Service }

// NewHandler crea una nueva instancia del handler HTTP para estadísticas del dashboard.
func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// GetStats procesa la solicitud HTTP para obtener las métricas de reservas e ingresos del mes.
func (h *Handler) GetStats(c *gin.Context) {
	stats, err := h.svc.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}
