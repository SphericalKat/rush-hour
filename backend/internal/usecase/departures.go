package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
)

const departureCacheTTL = 1 * time.Hour

type DeparturesUseCase struct {
	trains train.Repository
	redis  *redis.Client
}

func NewDepartures(trains train.Repository, redis *redis.Client) *DeparturesUseCase {
	return &DeparturesUseCase{trains: trains, redis: redis}
}

func departureCacheKey(stationID int64, destinationID *int64) string {
	if destinationID != nil {
		return fmt.Sprintf("departures:%d:dest:%d", stationID, *destinationID)
	}
	return fmt.Sprintf("departures:%d", stationID)
}

// GetDepartures returns all trains departing from stationID in chronological order.
func (uc *DeparturesUseCase) GetDepartures(ctx context.Context, stationID int64, destinationID *int64) ([]train.Departure, error) {
	deps, err := uc.getCachedOrFetch(ctx, stationID, destinationID)
	if err != nil {
		return nil, err
	}

	sort.SliceStable(deps, func(i, j int) bool {
		return deps[i].Departure < deps[j].Departure
	})

	return deps, nil
}

func (uc *DeparturesUseCase) getCachedOrFetch(ctx context.Context, stationID int64, destinationID *int64) ([]train.Departure, error) {
	key := departureCacheKey(stationID, destinationID)

	cached, err := uc.redis.Get(ctx, key).Bytes()
	if err == nil {
		var deps []train.Departure
		if json.Unmarshal(cached, &deps) == nil {
			return deps, nil
		}
	}

	deps, err := uc.trains.GetDepartures(ctx, stationID, destinationID)
	if err != nil {
		return nil, err
	}

	if data, err := json.Marshal(deps); err == nil {
		uc.redis.Set(ctx, key, data, departureCacheTTL)
	}

	return deps, nil
}
