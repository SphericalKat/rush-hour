package usecase_test

import (
	"context"
	"testing"

	"github.com/alicebob/miniredis/v2"
	goredis "github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"

	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
	"github.com/sphericalkat/rush-hour/backend/internal/usecase"
)

type mockTrainRepo struct {
	result []train.Departure
}

func (m *mockTrainRepo) GetDepartures(_ context.Context, _ int64, _ *int64) ([]train.Departure, error) {
	return m.result, nil
}

func (m *mockTrainRepo) GetStops(_ context.Context, _ string) ([]train.Stop, error) {
	return nil, nil
}

func (m *mockTrainRepo) GetStopsWithCoords(_ context.Context, _ string) ([]train.StopWithCoord, error) {
	return nil, nil
}

func TestDeparturesReordersByFromMinute(t *testing.T) {
	mr, _ := miniredis.Run()
	t.Cleanup(mr.Close)
	rc := goredis.NewClient(&goredis.Options{Addr: mr.Addr()})

	deps := []train.Departure{
		{Number: "90001", Departure: 300},
		{Number: "90003", Departure: 1420},
	}
	mock := &mockTrainRepo{result: deps}
	uc := usecase.NewDepartures(mock, rc)

	// fromMinute=1400 means 90003 (1420) should come first, 90001 (300) wraps to after
	got, err := uc.GetDepartures(context.Background(), 1, 1400, nil)
	require.NoError(t, err)
	require.Len(t, got, 2)
	require.Equal(t, "90003", got[0].Number)
	require.Equal(t, "90001", got[1].Number)
}
