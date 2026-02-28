package usecase_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
	"github.com/sphericalkat/rush-hour/backend/internal/usecase"
)

// mockTrainRepo captures the from/until values the repo is called with.
type mockTrainRepo struct {
	calledFrom  int
	calledUntil int
	result      []train.Departure
}

func (m *mockTrainRepo) GetDepartures(_ context.Context, _ int64, _ string, from, until int, _ *int64) ([]train.Departure, error) {
	m.calledFrom = from
	m.calledUntil = until
	return m.result, nil
}

func TestDeparturesWindowCalc(t *testing.T) {
	mock := &mockTrainRepo{}
	uc := usecase.NewDepartures(mock)

	_, err := uc.GetDepartures(context.Background(), 1, "down", 300, 60, nil)
	require.NoError(t, err)
	require.Equal(t, 300, mock.calledFrom)
	require.Equal(t, 360, mock.calledUntil)
}

func TestDeparturesWindowMidnightWrap(t *testing.T) {
	mock := &mockTrainRepo{}
	uc := usecase.NewDepartures(mock)

	// 23:30 = 1410, window 60 → until = 1470 (> 1440, crosses midnight)
	_, err := uc.GetDepartures(context.Background(), 1, "down", 1410, 60, nil)
	require.NoError(t, err)
	require.Equal(t, 1410, mock.calledFrom)
	require.Equal(t, 1470, mock.calledUntil)
}

func TestDeparturesPassesResultsThrough(t *testing.T) {
	expected := []train.Departure{
		{Number: "90001", Departure: 300, Station: "CSMT"},
	}
	mock := &mockTrainRepo{result: expected}
	uc := usecase.NewDepartures(mock)

	got, err := uc.GetDepartures(context.Background(), 1, "down", 280, 60, nil)
	require.NoError(t, err)
	require.Equal(t, expected, got)
}
