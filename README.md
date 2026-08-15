# Turnero — Sistema de Reservas para Cancha de Fútbol

> Documentación técnica completa: arquitectura, decisiones de diseño, dependencias, guía de inicio y referencia de API.

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Credenciales por Defecto](#2-credenciales-por-defecto)
3. [Dependencias del Sistema](#3-dependencias-del-sistema)
4. [Guía de Inicio](#4-guía-de-inicio)
5. [Estructura del Proyecto](#5-estructura-del-proyecto)
6. [Decisiones Arquitectónicas](#6-decisiones-arquitectónicas)
7. [Módulos del Backend](#7-módulos-del-backend)
8. [Reglas de Negocio](#8-reglas-de-negocio)
9. [API REST — Referencia](#9-api-rest--referencia)
10. [Modelo de Datos](#10-modelo-de-datos)
11. [Variables de Entorno](#11-variables-de-entorno)

---

## 1. Descripción General

**Turnero** es una aplicación web para gestionar reservas de canchas de fútbol. Permite a clientes ver disponibilidad en un calendario y crear reservas, mientras los administradores gestionan canchas, confirman o cancelan turnos, y monitorean ingresos del mes.

| Componente | Tecnología |
|---|---|
| Backend | Go 1.22+ con Gin |
| Base de datos | PostgreSQL 15 |
| ORM | GORM |
| Autenticación | JWT (HS256, 24h de vigencia) |
| Frontend | React 18 + TypeScript + Vite |
| Contenedores | Docker + Docker Compose |
| Servidor web prod | Nginx |

---

## 2. Credenciales por Defecto

> [!IMPORTANT]
> Al iniciar el backend por primera vez, se crean automáticamente estos datos iniciales si la base de datos está vacía (seeding automático en `main.go`).

### Usuario Administrador

| Campo | Valor |
|---|---|
| **Email** | `admin@turnero.com` |
| **Contraseña** | `admin123` |
| **Rol** | `ADMIN` |

### Configuración Inicial del Negocio

| Parámetro | Valor inicial |
|---|---|
| Precio por turno | $5.000 |
| Hora de apertura | 08:00 |
| Hora de cierre | 22:00 |
| Duración del turno | 60 minutos |

> [!CAUTION]
> Cambiá la contraseña del admin y el valor de `JWT_SECRET` **antes** de cualquier despliegue en producción.

---

## 3. Dependencias del Sistema

### Para desarrollo local

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| **Go** | 1.22 | https://go.dev/dl/ |
| **Node.js** | 20 LTS | https://nodejs.org/ |
| **PostgreSQL** | 15 | https://www.postgresql.org/download/ |

### Para despliegue con Docker (recomendado)

| Herramienta | Versión mínima |
|---|---|
| **Docker** | 24+ |
| **Docker Compose** | v2 (incluido en Docker Desktop) |

> [!TIP]
> Con Docker **no necesitás** instalar Go, Node ni PostgreSQL. El `Dockerfile` del backend corre `go mod tidy` automáticamente durante el build.

### Paquetes Go (backend — `go.mod`)

| Paquete | Versión | Función |
|---|---|---|
| `github.com/gin-gonic/gin` | v1.9.1 | HTTP framework |
| `github.com/golang-jwt/jwt/v5` | v5.2.1 | Generación y validación de JWT |
| `github.com/google/uuid` | v1.6.0 | UUIDs para claves primarias |
| `golang.org/x/crypto` | v0.27.0 | bcrypt para hasheo de contraseñas |
| `gorm.io/gorm` | v1.25.12 | ORM principal |
| `gorm.io/driver/postgres` | v1.5.11 | Driver PostgreSQL para GORM |

### Paquetes Node (frontend — `package.json`)

| Paquete | Versión | Función |
|---|---|---|
| `react` + `react-dom` | ^18.3.1 | UI framework |
| `react-router-dom` | ^6.26.0 | Routing SPA |
| `axios` | ^1.7.2 | HTTP client con interceptores |
| `date-fns` | ^3.6.0 | Manipulación de fechas y locale ES |
| `vite` | ^5.3.4 | Bundler y dev server |
| `typescript` | ^5.5.3 | Tipado estático |

---

## 4. Guía de Inicio

### ▶ Opción A — Docker Compose (recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/api |
| PostgreSQL | localhost:5432 |

**Detener los servicios:**
```bash
docker-compose down

# Para eliminar también el volumen de la DB:
docker-compose down -v
```

---

### ▶ Opción B — Desarrollo local

#### Paso 1 — Base de datos

```sql
-- Ejecutar en psql como superusuario
CREATE USER turnero_user WITH PASSWORD 'password123';
CREATE DATABASE turnero_db OWNER turnero_user;
```

#### Paso 2 — Backend

```bash
cd backend

# Descargar dependencias y generar go.sum
go mod tidy

# Iniciar el servidor (auto-migra tablas y crea seeds)
go run ./cmd/server

# Servidor disponible en: http://localhost:8080
```

#### Paso 3 — Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar dev server con proxy automático a :8080
npm run dev

# Frontend disponible en: http://localhost:5173
```

#### Paso 4 — Ejecutar tests del backend

```bash
cd backend
go test ./internal/bookings/... -v
```

Resultado esperado (7 tests, todos PASS):
```
--- PASS: TestCreate_ValidFuture           (RN#3 válido)
--- PASS: TestCreate_PastBooking           (RN#3 inválido)
--- PASS: TestCreate_Overlap               (RN#1 inválido)
--- PASS: TestCreate_OutsideHours          (RN#2 inválido)
--- PASS: TestCreate_WithinHours           (RN#2 válido)
--- PASS: TestUpdateStatus_PendingToConfirmed  (RN#4 válido)
--- PASS: TestUpdateStatus_CancelledToConfirmed (RN#4 inválido)
ok  turnero/internal/bookings  ~2s
```

#### Paso 5 — Build de producción del frontend

```bash
cd frontend
npm run build   # genera /frontend/dist listo para Nginx
```

---

## 5. Estructura del Proyecto

```
Ingesoftturnero/
├── docker-compose.yml
│
├── backend/
│   ├── Dockerfile                      # Multi-stage: Go builder → Alpine
│   ├── go.mod / go.sum
│   ├── cmd/server/main.go              # Entry point: DB, migrate, seeds, router
│   └── internal/
│       ├── middleware/
│       │   ├── auth.go                 # JWT middleware + RequireRole
│       │   └── cors.go
│       ├── auth/
│       │   ├── service.go              # Register, Login, sign JWT
│       │   └── handler.go
│       ├── users/
│       │   ├── model.go
│       │   ├── repository.go
│       │   ├── service.go
│       │   └── handler.go
│       ├── courts/
│       │   ├── model.go
│       │   ├── repository.go           # Soft-delete vía is_active
│       │   ├── service.go
│       │   └── handler.go
│       ├── settings/
│       │   ├── model.go                # Singleton (id=1)
│       │   ├── repository.go
│       │   ├── service.go
│       │   └── handler.go
│       ├── bookings/
│       │   ├── model.go
│       │   ├── repository.go           # Interface + implementación GORM
│       │   ├── service.go              # Reglas de negocio RN#1-4
│       │   ├── service_test.go         # 7 tests con mocks en memoria
│       │   └── handler.go
│       └── dashboard/
│           ├── repository.go           # Agregación SQL del mes (RN#7)
│           ├── service.go
│           └── handler.go
│
└── frontend/
    ├── Dockerfile                      # Multi-stage: Node/Vite → Nginx
    ├── nginx.conf                      # SPA fallback + proxy /api
    ├── package.json
    ├── vite.config.ts                  # Dev proxy a :8080
    ├── index.html
    └── src/
        ├── App.tsx                     # Router por rol (ADMIN/CLIENT)
        ├── index.css                   # Design system (CSS variables)
        ├── types/index.ts              # Interfaces TS de toda la API
        ├── api/                        # Una función por endpoint
        │   ├── client.ts              # Axios + interceptor JWT auto-logout
        │   ├── auth.ts
        │   ├── courts.ts
        │   ├── bookings.ts
        │   ├── settings.ts
        │   └── dashboard.ts
        ├── store/AuthContext.tsx        # Context API + localStorage
        ├── components/
        │   ├── Sidebar.tsx
        │   └── LoadingSpinner.tsx
        └── pages/
            ├── Login.tsx / Register.tsx
            ├── client/
            │   ├── Dashboard.tsx
            │   ├── BookingCalendar.tsx  # Calendario + slots + form (RN#5, RN#6)
            │   └── MyBookings.tsx
            └── admin/
                ├── Dashboard.tsx        # Stats del mes (RN#7)
                ├── BookingGrid.tsx      # Tabla con filtros y acciones
                ├── CourtManager.tsx     # ABM de canchas con modal
                └── Settings.tsx        # Config global de precio y horarios
```

---

## 6. Decisiones Arquitectónicas

### ADR-01: Package by Feature

**Contexto:** Organizar el código en un proyecto de mediana escala.

**Decisión:** Usar _Package by Feature_ — cada módulo de dominio (`/users`, `/bookings`, `/courts`, etc.) contiene su propio model, repository, service y handler.

**Alternativa considerada:** MVC clásico (todos los controllers juntos, todos los models juntos).

**Razonamiento:**
- **Alta Cohesión (GRASP):** Lo que cambia junto, vive junto. Si mañana se agrega una funcionalidad de "torneos", se crea `/tournaments` sin tocar nada más.
- **Bajo Acoplamiento:** Los módulos no se importan entre sí horizontalmente, solo se comunican a través de interfaces.
- **Onboarding:** Un desarrollador nuevo puede entrar al módulo `bookings` y entender todo lo referente a reservas sin navegar entre carpetas.

---

### ADR-02: Repository Pattern con Interfaces en Bookings

**Contexto:** El módulo `bookings` tiene lógica de negocio compleja que necesita ser testeada sin una base de datos real.

**Decisión:** Definir una interface `BookingRepository` e inyectarla en el `Service`. La implementación GORM es un detalle de infraestructura.

**Implementación:**
```go
// Interface en bookings/repository.go
type BookingRepository interface {
    Create(b *Booking) error
    HasOverlap(courtID uuid.UUID, start, end time.Time, excludeID *uuid.UUID) (bool, error)
    FindByID(id uuid.UUID) (*Booking, error)
    // ...
}

// Service inyecta la interfaz, no la struct concreta
type Service struct {
    repo         BookingRepository  // ← cualquier implementación vale
    settingsRepo settingsGetter
}
```

**Beneficio principal:** Los 7 tests unitarios corren en ~2 segundos sin levantar Docker ni PostgreSQL.

---

### ADR-03: JWT Stateless

**Decisión:** Tokens JWT firmados con HS256, sin persistencia en base de datos.

**Payload del token:**
```json
{
  "user_id": "uuid-del-usuario",
  "role": "ADMIN | CLIENT",
  "exp": 1720000000
}
```

**Vigencia:** 24 horas. Después el frontend redirige al login automáticamente (interceptor Axios).

**Trade-off:** No es posible invalidar un token antes de su expiración (no hay blacklist). Para este sistema es aceptable — en producción se puede agregar una tabla de tokens revocados si se necesita.

**Decisión de implementación — evitar import circular:**
El paquete `auth` define su propia struct `tokenClaims` con los mismos JSON tags que `middleware.Claims`, evitando importar el paquete `middleware` desde `auth`.

---

### ADR-04: Máquina de Estados para Reservas

**Decisión:** Las transiciones de estado de una reserva están controladas por una tabla de transiciones válidas.

```
PENDIENTE  →  CONFIRMADO  (admin confirma)
PENDIENTE  →  CANCELADO   (admin o cliente cancela)
CONFIRMADO →  CANCELADO   (admin cancela)
CANCELADO  →  ✗           (estado terminal)
```

**Implementación:**
```go
func validTransition(from, to string) bool {
    allowed := map[string][]string{
        StatusPending:   {StatusConfirmed, StatusCancelled},
        StatusConfirmed: {StatusCancelled},
        StatusCancelled: {},  // sin salida
    }
    for _, v := range allowed[from] {
        if v == to { return true }
    }
    return false
}
```

---

### ADR-05: Precio Snapshot en Reservas

**Decisión:** Al crear una reserva, el precio se copia del settings actual en el campo `price_at_booking`.

**Razonamiento:** Si el admin cambia el precio de $5.000 a $7.000, las reservas anteriores deben conservar su precio original. El campo `price_at_booking` es inmutable después de creado.

---

### ADR-06: Routing por Rol sin Guards Genéricos

**Decisión:** `App.tsx` renderiza distintos árboles de rutas según el rol, en lugar de un `<ProtectedRoute>` que verifica y redirige.

```tsx
// Un ADMIN directamente no tiene las rutas de CLIENT registradas
if (user?.role === 'ADMIN') {
    return <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        // ...rutas de admin solamente
    </Routes>;
}
```

**Beneficio:** Un usuario ADMIN no puede acceder a rutas de CLIENT aunque las tipee manualmente en la URL. El router simplemente no las conoce.

---

## 7. Módulos del Backend

### `auth`
Gestiona registro y login. No tiene model propio — opera sobre `users.Repository`.

| Función | Descripción |
|---|---|
| `Register(req)` | Hash de password con bcrypt, crea usuario CLIENT, retorna JWT |
| `Login(req)` | Verifica email + hash, retorna JWT |
| `sign(user)` | Genera JWT HS256 con `{user_id, role, exp: now+24h}` |

### `courts`
Gestión de canchas con borrado **lógico** (`is_active = false`). Nunca se elimina una cancha físicamente para preservar la integridad referencial con reservas históricas.

### `settings`
Singleton en tabla con `id = 1` siempre. El admin puede actualizar precio, horario de apertura/cierre y duración del slot. Todos los cambios son inmediatamente efectivos para nuevas reservas.

### `bookings`
El módulo más complejo. Implementa las 4 reglas de negocio del backend:

**Cálculo de disponibilidad (`GetAvailability`):**
1. Obtiene settings (horario + duración del slot).
2. Genera todos los slots posibles del día: `08:00→09:00`, `09:00→10:00`, ... hasta que el slot cabe antes del cierre.
3. Consulta reservas no canceladas para esa cancha y fecha.
4. Marca `available: false` en los slots solapados.

### `dashboard`
Consulta SQL agregada para el mes en curso. Ejemplo simplificado:
```sql
SELECT COALESCE(SUM(price_at_booking), 0) AS revenue,
       COUNT(*) FILTER (WHERE status = 'CONFIRMADO') AS confirmed,
       COUNT(*) FILTER (WHERE status = 'CANCELADO')  AS cancelled,
       COUNT(*) FILTER (WHERE status = 'PENDIENTE')  AS pending
FROM bookings
WHERE created_at >= '2024-08-01' AND created_at < '2024-09-01'
```

---

## 8. Reglas de Negocio

| # | Regla | Capa | Test / Validación |
|---|---|---|---|
| **RN1** | No se pueden crear reservas solapadas en la misma cancha | Backend Service | `TestCreate_Overlap` |
| **RN2** | La reserva debe caer dentro del horario operativo | Backend Service | `TestCreate_OutsideHours` / `WithinHours` |
| **RN3** | No se pueden crear reservas en el pasado | Backend Service | `TestCreate_PastBooking` / `ValidFuture` |
| **RN4** | Solo transiciones de estado válidas (máquina de estados) | Backend Service | `TestUpdateStatus_*` |
| **RN5** | Los días pasados en el calendario están deshabilitados | Frontend (BookingCalendar) | clase `cal-disabled` + `aria-disabled` |
| **RN6** | Botón "Confirmar" deshabilitado hasta elegir slot Y nombre de equipo | Frontend (BookingCalendar) | `disabled={!teamName.trim()}` en `#confirm-booking-btn` |
| **RN7** | Los ingresos del dashboard solo contabilizan reservas CONFIRMADAS | Backend Dashboard | `WHERE status = 'CONFIRMADO'` |

---

## 9. API REST — Referencia

**Base URL:** `http://localhost:8080/api`

**Autenticación:** Header `Authorization: Bearer <token>` en todos los endpoints protegidos.

### Auth (público)

| Método | Endpoint | Body | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | `{name, email, password}` | `{token, user}` |
| POST | `/auth/login` | `{email, password}` | `{token, user}` |

### Canchas

| Método | Endpoint | Auth | Body / Params |
|---|---|---|---|
| GET | `/courts` | Autenticado | — |
| POST | `/courts` | ADMIN | `{name, description}` |
| PUT | `/courts/:id` | ADMIN | `{name, description, is_active}` |
| DELETE | `/courts/:id` | ADMIN | — |

### Reservas

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/bookings` | ADMIN | Todas las reservas (con User y Court preloaded) |
| GET | `/bookings/my` | CLIENT | Mis reservas futuras no canceladas |
| GET | `/bookings/availability?court_id=UUID&date=YYYY-MM-DD` | Autenticado | Array de slots con disponibilidad |
| POST | `/bookings` | CLIENT | `{court_id, team_name, start_time}` |
| PATCH | `/bookings/:id/status` | ADMIN | `{status: "CONFIRMADO" o "CANCELADO"}` |
| PATCH | `/bookings/:id/cancel` | CLIENT | — (solo propias y PENDIENTES) |

**Ejemplo — respuesta de availability:**
```json
{
  "slots": [
    { "start_time": "2024-08-15T11:00:00Z", "end_time": "2024-08-15T12:00:00Z", "available": true },
    { "start_time": "2024-08-15T12:00:00Z", "end_time": "2024-08-15T13:00:00Z", "available": false }
  ]
}
```

### Configuración

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/settings` | Autenticado | Config actual |
| PUT | `/settings` | ADMIN | `{base_price, open_time, close_time, slot_duration_minutes}` |

### Dashboard

| Método | Endpoint | Auth | Respuesta |
|---|---|---|---|
| GET | `/dashboard/stats` | ADMIN | `{month_revenue, confirmed_count, cancelled_count, pending_count}` |

---

## 10. Modelo de Datos

```
┌─────────────────┐       ┌─────────────────┐
│     users        │       │     courts       │
├─────────────────┤       ├─────────────────┤
│ id UUID PK       │       │ id UUID PK       │
│ name VARCHAR     │       │ name VARCHAR     │
│ email UNIQUE     │       │ description      │
│ password_hash    │       │ is_active BOOL   │
│ role VARCHAR     │       │ created_at       │
│ created_at       │       │ updated_at       │
│ updated_at       │       └────────┬─────────┘
└────────┬─────────┘                │
         │                          │
         │   ┌──────────────────────┤
         │   │   bookings           │
         │   ├──────────────────────┤
         └──►│ user_id FK           │◄──┘
             │ court_id FK          │
             │ team_name VARCHAR    │
             │ start_time TIMESTAMP │
             │ end_time TIMESTAMP   │
             │ price_at_booking DEC │ ← snapshot inmutable
             │ status VARCHAR       │   PENDIENTE|CONFIRMADO|CANCELADO
             │ created_at           │
             │ updated_at           │
             └──────────────────────┘

┌─────────────────────────────┐
│   settings (singleton)       │
├─────────────────────────────┤
│ id = 1 (siempre)            │
│ base_price DECIMAL          │
│ open_time VARCHAR "HH:MM"   │
│ close_time VARCHAR "HH:MM"  │
│ slot_duration_minutes INT   │
│ updated_at                  │
└─────────────────────────────┘
```

> [!NOTE]
> Las migraciones se aplican automáticamente con `db.AutoMigrate()` al iniciar el servidor. No se necesitan scripts SQL manuales.

---

## 11. Variables de Entorno

### Backend

| Variable | Default dev | Descripción |
|---|---|---|
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `DB_USER` | `turnero_user` | Usuario de la DB |
| `DB_PASSWORD` | `password123` | Contraseña de la DB |
| `DB_NAME` | `turnero_db` | Nombre de la base de datos |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `JWT_SECRET` | `supersecret` | Clave de firma JWT |
| `PORT` | `8080` | Puerto HTTP del servidor |

> [!WARNING]
> `JWT_SECRET` debe ser al menos 32 caracteres aleatorios en producción. Podés generar uno con: `openssl rand -hex 32`

### Frontend

No requiere variables de entorno de usuario. Vite proxea `/api/*` al backend en desarrollo; Nginx hace lo mismo en producción (configurado en `nginx.conf`).

---

*Documentación — Proyecto Turnero · Ingesoft*
