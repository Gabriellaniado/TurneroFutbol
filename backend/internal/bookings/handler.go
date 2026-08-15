package bookings

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct{ svc *Service }

// NewHandler crea una nueva instancia del handler HTTP de reservas.
func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// ListAll maneja la solicitud HTTP del administrador para listar todas las reservas registradas.
func (h *Handler) ListAll(c *gin.Context) {
	bs, err := h.svc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, bs)
}

// ListMy maneja la solicitud del cliente autenticado para ver sus próximas reservas futuras.
func (h *Handler) ListMy(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user ID inválido"})
		return
	}
	bs, err := h.svc.GetMyFuture(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, bs)
}

// GetAvailability consulta y devuelve los horarios disponibles de una cancha para una fecha dada.
func (h *Handler) GetAvailability(c *gin.Context) {
	courtID, err := uuid.Parse(c.Query("court_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "court_id inválido"})
		return
	}
	dateStr := c.Query("date")
	slots, err := h.svc.GetAvailability(courtID, dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"slots": slots})
}

// Create procesa la creación de una nueva reserva validando reglas de negocio y pertenencia al usuario.
func (h *Handler) Create(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user ID inválido"})
		return
	}
	var req CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	b, err := h.svc.Create(req, userID)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, b)
}

// UpdateStatus permite al administrador actualizar el estado de una reserva (ej: confirmar o cancelar).
func (h *Handler) UpdateStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	b, err := h.svc.UpdateStatus(id, req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, b)
}

// CancelMy permite al cliente cancelar su propia reserva siempre que esté en estado PENDIENTE.
func (h *Handler) CancelMy(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user ID inválido"})
		return
	}
	bookingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	b, err := h.svc.CancelMy(bookingID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, b)
}
