# -------- Build stage --------
FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -o pocketbase main.go


# -------- Runtime stage --------
FROM alpine:3.19

WORKDIR /app

COPY --from=builder /app/pocketbase .

RUN mkdir -p /app/pb_data

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
