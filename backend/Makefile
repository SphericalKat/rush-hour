.PHONY: dev deps stop

deps:
	docker compose up redis -d

dev: deps
	ADDR=:8080 \
	TIMETABLE_DB_PATH=../parser/data/timetable.db \
	REDIS_URL=localhost:6379 \
	air

stop:
	docker compose down
