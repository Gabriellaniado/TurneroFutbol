package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"turnero/internal/users"
)

// tokenClaims mirrors middleware.Claims JSON structure — avoids circular imports.
type tokenClaims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  *users.User `json:"user"`
}

type Service struct {
	userRepo  *users.Repository
	jwtSecret string
}

// NewService inicializa el servicio de autenticación con el repositorio de usuarios y secreto JWT.
func NewService(userRepo *users.Repository, jwtSecret string) *Service {
	return &Service{userRepo: userRepo, jwtSecret: jwtSecret}
}

// Register valida los datos, hashea la contraseña, guarda al usuario y retorna su token de acceso.
func (s *Service) Register(req RegisterRequest) (*AuthResponse, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	u := &users.User{
		ID:           uuid.New(),
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         users.RoleClient,
	}
	if err := s.userRepo.Create(u); err != nil {
		return nil, errors.New("el email ya está registrado")
	}
	token, err := s.sign(u)
	if err != nil {
		return nil, err
	}
	return &AuthResponse{Token: token, User: u}, nil
}

// Login verifica las credenciales del usuario y genera un token JWT si el acceso es válido.
func (s *Service) Login(req LoginRequest) (*AuthResponse, error) {
	u, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, errors.New("credenciales inválidas")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("credenciales inválidas")
	}
	token, err := s.sign(u)
	if err != nil {
		return nil, err
	}
	return &AuthResponse{Token: token, User: u}, nil
}

// sign construye y firma criptográficamente el token JWT con los claims del usuario.
func (s *Service) sign(u *users.User) (string, error) {
	claims := tokenClaims{
		UserID: u.ID.String(),
		Role:   u.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(s.jwtSecret))
}
