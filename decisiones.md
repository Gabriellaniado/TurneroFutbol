# decisiones.md

## TP1 — Protecciones de rama

*(ver historial del TP1)*

---

## TP2 — Contenedores

### App elegida: Turnero — Sistema de Reservas para Cancha de Fútbol

**¿Qué es?**
Aplicación web propia para gestionar reservas de canchas de fútbol. Permite a clientes ver disponibilidad en un calendario y crear reservas; los administradores gestionan canchas, confirman/cancelan turnos y monitorean ingresos del mes.

### Criterios de elección (§3.3)

| Criterio | Evaluación |
|---|---|
| ¿Buildea y corre localmente sin magia? | ✅ Sí — `go run ./cmd/server` + `npm run dev` levantan el sistema completo con un contenedor de Postgres |
| ¿Tiene tests? | ✅ Sí — 7 tests unitarios en `internal/bookings/service_test.go` con mocks en memoria (sin DB) |
| ¿Entiendo el código para modificarlo? | ✅ Es un proyecto propio: escribí cada línea |
| Tamaño adecuado | ✅ CRUD + autenticación JWT + 4 pantallas de admin + 3 de cliente |
| ¿Es individual? | ✅ Desarrollo propio, nadie más lo usa |

**¿Por qué esta y no otra?**
Es un proyecto que empecé para practicar Go y quería darle uso real. Cumple todos los requisitos (back + front + BD), tiene reglas de negocio concretas que se pueden testear, y entiendo el código al punto de poder modificarlo en vivo sin dudas.

---

### Decisiones de contenerización

#### Imágenes base elegidas

| Componente | Imagen de build | Imagen final | Razón |
|---|---|---|---|
| Backend | `golang:1.24-alpine` | `alpine:latest` | El compilador de Go no hace falta en runtime. El binario es estático (`CGO_ENABLED=0`), solo necesita ca-certificates y tzdata |
| Frontend | `node:20-alpine` | `nginx:alpine` | Node y Vite no hacen falta en runtime. nginx sirve los estáticos y hace de proxy inverso para `/api/` |
| Base de datos | — | `postgres:15-alpine` | Versión que usa el proyecto. Alpine por el peso mínimo |

#### Estructura multi-stage

**¿Por qué multi-stage?**
Sin multi-stage, la imagen final del backend incluiría el SDK completo de Go (~600 MB). Con multi-stage, la imagen final pesa ~15 MB y solo contiene el binario compilado. Lo mismo para el frontend: sin multi-stage, viajarían Node, Vite y `node_modules` (~200 MB); con multi-stage, solo viajan los HTML/JS/CSS del `dist/`.

**Orden de instrucciones para aprovechar el cache:**
Copiamos primero `go.mod`/`go.sum` (o `package*.json`), instalamos dependencias, y recién después copiamos el código fuente. Así Docker no reinstala todas las dependencias cada vez que cambia una línea de código — solo cuando cambian los manifiestos de dependencias.

#### ¿Qué persiste y qué no?

| Dato | Persiste | Mecanismo |
|---|---|---|
| Registros de la BD (usuarios, canchas, reservas, settings) | ✅ | Volumen nombrado `pgdata` en `docker-compose.yml` |
| `dist/` del frontend | ❌ | Se reconstruye en cada `docker compose up --build`. No hace falta persistirlo |
| Binario del backend | ❌ | Se recompila en cada build. No hace falta persistirlo |

`docker compose down` apaga los contenedores pero el volumen `pgdata` sobrevive → los datos siguen al próximo `up`.
`docker compose down -v` borra también el volumen → los datos se pierden.

#### nginx.conf: por qué usamos resolver + variable

Sin el `resolver 127.0.0.11` y sin guardar el nombre en una variable, nginx resuelve el nombre `backend` al arrancar. Si el contenedor del backend todavía no existe, nginx rechaza levantar. Con la variable, la resolución ocurre recién cuando llega el primer pedido, lo que permite que el frontend levante solo.

#### Secretos: .env no commiteado

Las contraseñas y el `JWT_SECRET` viajan en un `.env` local que está en `.gitignore`. El repo incluye `.env.example` con los nombres de las variables (sin valores reales) para que quien clone sepa qué necesita configurar.

---

### Problemas encontrados y cómo los resolví

| Problema | Causa | Solución |
|---|---|---|
| `permission denied` al crear archivos con el agente | El repo fue clonado con permisos de solo lectura | `chmod -R u+w` en la carpeta del proyecto |
| `server.exe` entraba al contexto de build del backend | No había `.dockerignore` en `backend/` | Crear `backend/.dockerignore` excluyendo `*.exe` y binarios compilados |
| `node_modules` de la máquina entraban al contexto del frontend | No había `.dockerignore` en `frontend/` | Crear `frontend/.dockerignore` excluyendo `node_modules/` y `dist/` |
| nginx no podría levantar si el backend no está listo | `proxy_pass` con nombre directo se resuelve al arrancar | Agregar `resolver 127.0.0.11` y usar variable `$backend_api` |
| Frontend usaba `npm install` en vez de `npm ci` | Primera versión del Dockerfile | Cambiar a `npm ci` para builds reproducibles que respetan el lockfile |
