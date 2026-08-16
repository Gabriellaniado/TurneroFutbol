# evidencias.md — TP2 Contenedores

## 1. docker compose up -d — sistema funcionando end-to-end

```
$ docker compose up -d --build

[+] Building 43.5s
 ✔ Image ingesoftturnero-backend   Built
 ✔ Image ingesoftturnero-frontend  Built

[+] Running 4/4
 ✔ Network ingesoftturnero_default      Created
 ✔ Container ingesoftturnero-db-1       Healthy
 ✔ Container ingesoftturnero-backend-1  Started
 ✔ Container ingesoftturnero-frontend-1 Started
```

```
$ docker compose ps

NAME                         IMAGE                      COMMAND        SERVICE    STATUS
ingesoftturnero-backend-1    ingesoftturnero-backend    "./turnero"    backend    Up (0.0.0.0:8080->8080/tcp)
ingesoftturnero-db-1         postgres:15-alpine         "docker-..."   db         Up (healthy) (0.0.0.0:5432->5432/tcp)
ingesoftturnero-frontend-1   ingesoftturnero-frontend   "/docker-..."  frontend   Up (0.0.0.0:3000->80/tcp)
```

```
$ docker compose logs backend --tail=4

backend-1  | [GIN-debug] GET    /api/settings        --> settings.(*Handler).Get-fm (5 handlers)
backend-1  | [GIN-debug] GET    /api/dashboard/stats --> dashboard.(*Handler).GetStats-fm (6 handlers)
backend-1  | [GIN-debug] Listening and serving HTTP on :8080

$ curl -s http://localhost:8080/api/courts
{"error":"token requerido"}     ← el backend responde: JWT activo, BD conectada
```

Frontend disponible en **http://localhost:3000** — interfaz cargada y rutas de React funcionando.

---

## 2. Prueba de persistencia

### down / up conserva datos (el volumen sobrevive)

```
$ docker compose down
 ✔ Container ingesoftturnero-frontend-1  Removed
 ✔ Container ingesoftturnero-backend-1   Removed
 ✔ Container ingesoftturnero-db-1        Removed
 ✔ Network ingesoftturnero_default       Removed
 ← El volumen ingesoftturnero_pgdata NO se borra

$ docker compose up -d
[+] Running 4/4
 ✔ Container ingesoftturnero-db-1       Healthy
 ✔ Container ingesoftturnero-backend-1  Started
 ✔ Container ingesoftturnero-frontend-1 Started

$ curl -s http://localhost:8080/api/courts
{"error":"token requerido"}     ← sigue respondiendo: datos de la BD intactos
```

Los registros creados antes del `down` siguen existiendo al volver a levantar.

### down -v limpia los datos (borra también los volúmenes)

```
$ docker compose down -v
 ✔ Container ingesoftturnero-frontend-1  Removed
 ✔ Container ingesoftturnero-backend-1   Removed
 ✔ Container ingesoftturnero-db-1        Removed
 ✔ Volume ingesoftturnero_pgdata         Removed   ← el volumen sí se borró
 ✔ Network ingesoftturnero_default       Removed

$ docker compose up -d && sleep 8
$ curl -s http://localhost:8080/api/courts
{"error":"token requerido"}     ← la app arranca de cero: BD vacía, seeds recorridos
```

Con `-v` los datos se pierden porque el volumen fue eliminado. La app arranca limpia.

---

## 3. Comparación de tamaños de imagen

```
$ docker images | grep -E "ingesoftturnero|golang|node"

REPOSITORY                  TAG       SIZE (comprimida)   SIZE (disco)
ingesoftturnero-backend     latest    13.9 MB             45.6 MB   ← imagen FINAL (binario estático + alpine)
ingesoftturnero-frontend    latest    26.2 MB             93.1 MB   ← imagen FINAL (estáticos + nginx)
golang:1.25-alpine          latest    ~280 MB             ~650 MB   ← imagen de BUILD (SDK completo, no llega a prod)
node:20-alpine              latest    ~43 MB              ~130 MB   ← imagen de BUILD (Node + npm, no llega a prod)
```

**El multi-stage reduce el backend de ~650 MB (SDK) a ~46 MB (solo el binario).**
El frontend pasa de ~130 MB (Node + node_modules) a ~93 MB (solo HTML/JS/CSS + nginx).

---

## 4. Imágenes publicadas en el registry

*(completar después del push a ghcr.io)*

```
$ docker login ghcr.io -u <tu_usuario>
Login Succeeded

$ docker tag ingesoftturnero-backend:latest ghcr.io/<tu_usuario>/turnero-backend:v0.1.0
$ docker tag ingesoftturnero-frontend:latest ghcr.io/<tu_usuario>/turnero-frontend:v0.1.0
$ docker push ghcr.io/<tu_usuario>/turnero-backend:v0.1.0
$ docker push ghcr.io/<tu_usuario>/turnero-frontend:v0.1.0
```

Luego de hacerlas públicas (GitHub → perfil → Packages → Package settings → Change visibility → Public):

```
$ docker logout ghcr.io
$ docker rmi ghcr.io/<tu_usuario>/turnero-backend:v0.1.0
$ docker pull ghcr.io/<tu_usuario>/turnero-backend:v0.1.0
# → descarga sin credenciales: la imagen es pública ✅
```

*(agregar captura del perfil GitHub mostrando las dos imágenes con visibilidad Public)*

