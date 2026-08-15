package users

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct{ svc *Service }

// NewHandler crea una nueva instancia del handler HTTP para la administración de usuarios.
func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// List procesa la solicitud HTTP para obtener el listado completo de usuarios registrados.
func (h *Handler) List(c *gin.Context) {
	us, err := h.svc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, us)
}
