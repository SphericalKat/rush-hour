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

// departuresQuery finds trains departing from a station within a time window.
// The midnight-wraparound clause handles windows that cross 00:00 (until > 1440).
const departuresQuery = `
SELECT t.number, COALESCE(t.code, '') AS code, t.is_ac, t.direction,
       l.short_name AS line, s.departure, st.name AS station,
       orig.name AS origin, dest.name AS destination
FROM stops s
JOIN trains t    ON s.train_id   = t.id
JOIN stations st ON s.station_id = st.id
JOIN lines l     ON t.line_id    = l.id
JOIN stations orig ON orig.id = (
  SELECT s2.station_id FROM stops s2
  WHERE s2.train_id = t.id ORDER BY s2.stop_sequence ASC LIMIT 1
)
JOIN stations dest ON dest.id = (
  SELECT s3.station_id FROM stops s3
  WHERE s3.train_id = t.id ORDER BY s3.stop_sequence DESC LIMIT 1
)
WHERE s.station_id = ?
  AND t.direction  = ?
  AND (
        (s.departure >= ? AND s.departure < ?)
     OR (? > 1440 AND s.departure < (? - 1440))
  )
ORDER BY s.departure
LIMIT 50`

func (r *trainRepo) GetDepartures(ctx context.Context, stationID int64, direction string, fromMinute, untilMinute int) ([]train.Departure, error) {
	rows, err := r.db.QueryxContext(ctx, departuresQuery,
		stationID, direction, fromMinute, untilMinute, untilMinute, untilMinute)
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
