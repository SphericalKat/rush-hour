package station

import "context"

type Repository interface {
	ListLines(ctx context.Context) ([]Line, error)
	ListStations(ctx context.Context) ([]Station, error)
}
