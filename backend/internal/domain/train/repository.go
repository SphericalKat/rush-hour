package train

import "context"

type Repository interface {
	GetDepartures(ctx context.Context, stationID int64, direction string, fromMinute, untilMinute int, destinationID *int64) ([]Departure, error)
}
