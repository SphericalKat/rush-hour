package usecase_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
	"github.com/sphericalkat/rush-hour/backend/internal/usecase"
)

type mockTrainRepo struct {
	calledFrom int
	result     []train.Departure
}

func (m *mockTrainRepo) GetDepartures(_ context.Context, _ int64, _ string, from int, _ *int64) ([]train.Departure, error) {
	m.calledFrom = from
	return m.result, nil
}

func TestDeparturesPassesResultsThrough(t *testing.T) {
	expected := []train.Departure{
		{Number: "90001", Departure: 300, Station: "CSMT"},
	}
	mock := &mockTrainRepo{result: expected}
	uc := usecase.NewDepartures(mock)

	got, err := uc.GetDepartures(context.Background(), 1, "down", 280, nil)
	require.NoError(t, err)
	require.Equal(t, expected, got)
}
