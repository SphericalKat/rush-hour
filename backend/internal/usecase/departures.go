package usecase

import (
	"context"

	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
)

type DeparturesUseCase struct {
	trains train.Repository
}

func NewDepartures(trains train.Repository) *DeparturesUseCase {
	return &DeparturesUseCase{trains: trains}
}

// GetDepartures returns the next trains departing from stationID in the given direction.
// If destinationID is non-nil, only trains that stop at that station after stationID are returned.
func (uc *DeparturesUseCase) GetDepartures(ctx context.Context, stationID int64, direction string, fromMinute int, destinationID *int64) ([]train.Departure, error) {
	return uc.trains.GetDepartures(ctx, stationID, direction, fromMinute, destinationID)
}
