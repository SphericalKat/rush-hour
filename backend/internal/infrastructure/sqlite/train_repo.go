package sqlite

import (
	"context"

	"github.com/jmoiron/sqlx"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
)

type trainRepo struct {
	db *sqlx.DB
}

func NewTrainRepo(db *sqlx.DB) train.Repository {
	return &trainRepo{db: db}
}

const departuresBase = `
SELECT t.number, COALESCE(t.code, '') AS code, t.is_ac, t.is_fast, t.direction,
       l.short_name AS line, l.name AS line_name, s.departure, st.name AS station,
       COALESCE(t.origin, '') AS origin, COALESCE(t.destination, '') AS destination,
       COALESCE(s.platform, '') AS platform
FROM stops s
JOIN trains t    ON s.train_id   = t.id
JOIN stations st ON s.station_id = st.id
JOIN lines l     ON t.line_id    = l.id
WHERE s.station_id = ?`

const destinationFilter = `
  AND EXISTS (
    SELECT 1 FROM stops s2
    WHERE s2.train_id = t.id
      AND s2.station_id = ?
      AND s2.stop_sequence > s.stop_sequence
  )`

const departuresOrder = `
ORDER BY s.departure`

const stopsQuery = `
SELECT st.name AS station, s.departure, s.stop_sequence, COALESCE(s.platform, '') AS platform, COALESCE(s.side, '') AS side
FROM stops s
JOIN stations st ON s.station_id = st.id
JOIN trains t ON s.train_id = t.id
WHERE t.number = ?
ORDER BY s.stop_sequence`

func (r *trainRepo) GetStops(ctx context.Context, trainNumber string) ([]train.Stop, error) {
	var out []train.Stop
	if err := r.db.SelectContext(ctx, &out, stopsQuery, trainNumber); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *trainRepo) GetDepartures(ctx context.Context, stationID int64, destinationID *int64) ([]train.Departure, error) {
	query := departuresBase
	args := []any{stationID}

	if destinationID != nil {
		query += destinationFilter
		args = append(args, *destinationID)
	}

	query += departuresOrder

	rows, err := r.db.QueryxContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []train.Departure
	for rows.Next() {
		var d train.Departure
		if err := rows.StructScan(&d); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}
