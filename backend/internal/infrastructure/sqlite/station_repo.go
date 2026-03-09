package sqlite

import (
	"context"
	"database/sql"

	"github.com/sphericalkat/rush-hour/backend/internal/domain/station"
	"github.com/sphericalkat/rush-hour/backend/internal/infrastructure/sqlite/gen"
)

type stationRepo struct {
	q *gen.Queries
}

func NewStationRepo(db *sql.DB) station.Repository {
	return &stationRepo{q: gen.New(db)}
}

func (r *stationRepo) ListLines(ctx context.Context) ([]station.Line, error) {
	rows, err := r.q.ListLines(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]station.Line, len(rows))
	for i, row := range rows {
		out[i] = station.Line{
			ID:        row.ID,
			Name:      row.Name,
			ShortName: row.ShortName,
			Type:      row.Type,
		}
	}
	return out, nil
}

func (r *stationRepo) ListStations(ctx context.Context) ([]station.Station, error) {
	rows, err := r.q.ListStations(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]station.Station, len(rows))
	for i, row := range rows {
		out[i] = station.Station{
			ID:   row.ID,
			Name: row.Name,
			Code: row.Code,
		}
	}
	return out, nil
}
