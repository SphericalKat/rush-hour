package train

import "context"

type Repository interface {
	GetDepartures(ctx context.Context, stationID int64, destinationID *int64) ([]Departure, error)
	GetStops(ctx context.Context, trainNumber string) ([]Stop, error)
	GetStopsWithCoords(ctx context.Context, trainNumber string) ([]StopWithCoord, error)
	GetLineStationsWithCoords(ctx context.Context, trainNumber string) ([]StopWithCoord, error)
}
