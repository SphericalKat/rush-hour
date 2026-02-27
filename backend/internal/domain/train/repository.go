package train

import "context"

type Repository interface {
	GetDepartures(ctx context.Context, stationID int64, direction string, fromMinute, untilMinute int) ([]Departure, error)
}
