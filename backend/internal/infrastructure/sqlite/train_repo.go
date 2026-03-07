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

// departuresBase returns the next trains from a given minute, wrapping around midnight.
const departuresBase = `
SELECT t.number, COALESCE(t.code, '') AS code, t.is_ac, t.is_fast, t.direction,
       l.short_name AS line, l.name AS line_name, s.departure, st.name AS station,
       COALESCE(t.origin, '') AS origin, COALESCE(t.destination, '') AS destination
FROM stops s
JOIN trains t    ON s.train_id   = t.id
JOIN stations st ON s.station_id = st.id
JOIN lines l     ON t.line_id    = l.id
WHERE s.station_id = ?
  AND t.direction  = ?`

const destinationFilter = `
  AND EXISTS (
    SELECT 1 FROM stops s2
    WHERE s2.train_id = t.id
      AND s2.station_id = ?
      AND s2.stop_sequence > s.stop_sequence
  )`

const departuresOrder = `
ORDER BY CASE WHEN s.departure >= ? THEN 0 ELSE 1 END, s.departure
LIMIT 50`

func (r *trainRepo) GetDepartures(ctx context.Context, stationID int64, direction string, fromMinute int, destinationID *int64) ([]train.Departure, error) {
	query := departuresBase
	args := []any{stationID, direction}

	if destinationID != nil {
		query += destinationFilter
		args = append(args, *destinationID)
	}

	query += departuresOrder
	args = append(args, fromMinute)

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
