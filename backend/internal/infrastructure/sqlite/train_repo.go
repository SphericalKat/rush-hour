package sqlite

import (
	"context"
	"database/sql"

	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
	"github.com/sphericalkat/rush-hour/backend/internal/infrastructure/sqlite/gen"
)

type trainRepo struct {
	q *gen.Queries
}

func NewTrainRepo(db *sql.DB) train.Repository {
	return &trainRepo{q: gen.New(db)}
}

func (r *trainRepo) GetDepartures(ctx context.Context, stationID int64, destinationID *int64) ([]train.Departure, error) {
	if destinationID != nil {
		rows, err := r.q.GetDeparturesWithDestination(ctx, gen.GetDeparturesWithDestinationParams{
			StationID:   stationID,
			StationID_2: *destinationID,
		})
		if err != nil {
			return nil, err
		}
		out := make([]train.Departure, len(rows))
		for i, row := range rows {
			out[i] = train.Departure{
				Number:      row.Number,
				Code:        row.Code,
				IsAC:        row.IsAc != 0,
				IsFast:      row.IsFast != 0,
				Direction:   row.Direction,
				Line:        row.Line,
				LineName:    row.LineName,
				Departure:   int(row.Departure),
				Station:     row.Station,
				Origin:      row.Origin,
				Destination: row.Destination,
				Platform:    row.Platform,
				RunsOn:      row.RunsOn,
				Note:        row.Note,
			}
		}
		return out, nil
	}

	rows, err := r.q.GetDepartures(ctx, stationID)
	if err != nil {
		return nil, err
	}
	out := make([]train.Departure, len(rows))
	for i, row := range rows {
		out[i] = train.Departure{
			Number:      row.Number,
			Code:        row.Code,
			IsAC:        row.IsAc != 0,
			IsFast:      row.IsFast != 0,
			Direction:   row.Direction,
			Line:        row.Line,
			LineName:    row.LineName,
			Departure:   int(row.Departure),
			Station:     row.Station,
			Origin:      row.Origin,
			Destination: row.Destination,
			Platform:    row.Platform,
			RunsOn:      row.RunsOn,
			Note:        row.Note,
		}
	}
	return out, nil
}

func (r *trainRepo) GetDestination(ctx context.Context, trainNumber string, line string) (string, error) {
	if line != "" {
		return r.q.GetDestinationWithLine(ctx, gen.GetDestinationWithLineParams{
			Number:    trainNumber,
			ShortName: line,
		})
	}
	return r.q.GetDestination(ctx, trainNumber)
}

func (r *trainRepo) GetStopsWithCoords(ctx context.Context, trainNumber string) ([]train.StopWithCoord, error) {
	rows, err := r.q.GetStopsWithCoords(ctx, trainNumber)
	if err != nil {
		return nil, err
	}
	out := make([]train.StopWithCoord, len(rows))
	for i, row := range rows {
		out[i] = train.StopWithCoord{
			Station: row.Station,
			Lat:     row.Lat.Float64,
			Lng:     row.Lng.Float64,
			Seq:     int(row.StopSequence),
		}
	}
	return out, nil
}

func (r *trainRepo) GetLineStationsWithCoords(ctx context.Context, trainNumber string) ([]train.StopWithCoord, error) {
	rows, err := r.q.GetLineStationsWithCoords(ctx, trainNumber)
	if err != nil {
		return nil, err
	}
	out := make([]train.StopWithCoord, len(rows))
	for i, row := range rows {
		out[i] = train.StopWithCoord{
			Station: row.Station,
			Lat:     row.Lat.Float64,
			Lng:     row.Lng.Float64,
			Seq:     int(row.StopSequence),
		}
	}
	return out, nil
}

func (r *trainRepo) GetStops(ctx context.Context, trainNumber string, line string) ([]train.Stop, error) {
	if line != "" {
		rows, err := r.q.GetStopsWithLine(ctx, gen.GetStopsWithLineParams{
			Number:    trainNumber,
			ShortName: line,
		})
		if err != nil {
			return nil, err
		}
		out := make([]train.Stop, len(rows))
		for i, row := range rows {
			out[i] = train.Stop{
				Station:      row.Station,
				Departure:    int(row.Departure),
				StopSequence: int(row.StopSequence),
				Platform:     row.Platform,
				Side:         row.Side,
			}
		}
		return out, nil
	}

	rows, err := r.q.GetStops(ctx, trainNumber)
	if err != nil {
		return nil, err
	}
	out := make([]train.Stop, len(rows))
	for i, row := range rows {
		out[i] = train.Stop{
			Station:      row.Station,
			Departure:    int(row.Departure),
			StopSequence: int(row.StopSequence),
			Platform:     row.Platform,
			Side:         row.Side,
		}
	}
	return out, nil
}
