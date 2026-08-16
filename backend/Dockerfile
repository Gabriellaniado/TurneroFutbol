# ---- Etapa 1: build (imagen con el compilador de Go) ----
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /turnero ./cmd/server

# ---- Etapa 2: runtime (imagen mínima, sin compilador)
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /turnero .
EXPOSE 8080
CMD ["./turnero"]
