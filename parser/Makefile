APK ?= $(wildcard *.apk)
DB  := data/timetable.db

.PHONY: db clean

db: $(DB)

$(DB): $(APK)
	@test -n "$(APK)" || (echo "usage: make db APK=/path/to/m-indicator.apk" && exit 1)
	@mkdir -p data
	uv run python -m rush_hour_parser apk-export "$(APK)" "$@"

clean:
	rm -f $(DB)
