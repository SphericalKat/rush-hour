package sqlite

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/station"
)

type stationRepo struct {
	db *sqlx.DB
}

func NewStationRepo(db *sqlx.DB) station.Repository {
	return &stationRepo{db: db}
}

func (r *stationRepo) ListLines(ctx context.Context) ([]station.Line, error) {
	var lines []station.Line
	err := r.db.SelectContext(ctx, &lines,
		`SELECT id, name, short_name, type FROM lines ORDER BY id`)
	return lines, err
}

func (r *stationRepo) ListStations(ctx context.Context) ([]station.Station, error) {
	var stations []station.Station
	err := r.db.SelectContext(ctx, &stations,
		`SELECT id, name, COALESCE(code, '') as code FROM stations ORDER BY name`)
	return stations, err
}
