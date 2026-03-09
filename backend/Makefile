.PHONY: dev deps stop build deploy sqlc

deps:
	docker compose up redis -d

dev: deps
	ADDR=:8080 \
	TIMETABLE_DB_PATH=../parser/data/timetable.db \
	REDIS_URL=localhost:6379 \
	air

stop:
	docker compose down

build:
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o server ./cmd/server

deploy: build
	ansible-playbook -i ../deploy/inventory.yml ../deploy/playbook.yml

sqlc:
	sqlc generate
