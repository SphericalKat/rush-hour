FROM golang:1.26-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /server ./cmd/server

FROM alpine:3.23

RUN apk add --no-cache tzdata && \
    addgroup -S app && adduser -S -G app app
USER app

COPY --from=builder /server /server
COPY mumbai_trains.db /data/mumbai_trains.db
EXPOSE 8080

ENV TIMETABLE_DB_PATH=/data/mumbai_trains.db
ENTRYPOINT ["/server"]
