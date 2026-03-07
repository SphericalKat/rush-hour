package sqlite_test

import (
	"context"
	"testing"

	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/require"

	"github.com/sphericalkat/rush-hour/backend/internal/infrastructure/sqlite"
)

const fixtureSchema = `
CREATE TABLE IF NOT EXISTS operators (id INTEGER PRIMARY KEY, name TEXT NOT NULL, short_name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS lines (id INTEGER PRIMARY KEY, operator_id INTEGER NOT NULL, name TEXT NOT NULL, short_name TEXT NOT NULL UNIQUE, type TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS stations (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, code TEXT, lat REAL, lng REAL);
CREATE TABLE IF NOT EXISTS line_stations (line_id INTEGER NOT NULL, station_id INTEGER NOT NULL, sequence INTEGER NOT NULL, PRIMARY KEY (line_id, station_id));
CREATE TABLE IF NOT EXISTS trains (id INTEGER PRIMARY KEY, line_id INTEGER NOT NULL, number TEXT NOT NULL, code TEXT, is_ac INTEGER NOT NULL DEFAULT 0, is_fast INTEGER NOT NULL DEFAULT 0, direction TEXT NOT NULL, origin TEXT, destination TEXT);
CREATE TABLE IF NOT EXISTS stops (id INTEGER PRIMARY KEY, train_id INTEGER NOT NULL, station_id INTEGER NOT NULL, departure INTEGER NOT NULL, stop_sequence INTEGER NOT NULL, platform TEXT, side TEXT);
`

func seedTrainDB(t *testing.T) *sqlx.DB {
	t.Helper()
	db, err := sqlite.Open(":memory:")
	require.NoError(t, err)
	t.Cleanup(func() { db.Close() })

	_, err = db.Exec(fixtureSchema)
	require.NoError(t, err)

	_, err = db.Exec(`
		INSERT INTO operators VALUES (1, 'Central Railway', 'CR');
		INSERT INTO lines VALUES (1, 1, 'Central Line', 'CR-ML', 'suburban_rail');
		INSERT INTO stations VALUES (1, 'CSMT', NULL, NULL, NULL), (2, 'Dadar', NULL, NULL, NULL), (3, 'Thane', NULL, NULL, NULL);

		-- Regular down train: CSMT 05:00, Dadar 05:30, Thane 06:00
		INSERT INTO trains VALUES (1, 1, '90001', 'TNA', 0, 0, 'down', 'CSMT', 'Thane');
		INSERT INTO stops (id, train_id, station_id, departure, stop_sequence) VALUES (1, 1, 1, 300, 0), (2, 1, 2, 330, 1), (3, 1, 3, 360, 2);

		-- Midnight-crossing down train: CSMT 23:40, Dadar 00:10 (= 1450), Thane 00:30 (= 1470)
		INSERT INTO trains VALUES (2, 1, '90003', 'TNA', 0, 0, 'down', 'CSMT', 'Thane');
		INSERT INTO stops (id, train_id, station_id, departure, stop_sequence) VALUES (4, 2, 1, 1420, 0), (5, 2, 2, 1450, 1), (6, 2, 3, 1470, 2);
	`)
	require.NoError(t, err)

	return db
}

func TestGetDepartures_FromCSMT(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	// From minute 280 (04:40), next trains from CSMT should be 90001 at 300, then 90003 at 1420
	deps, err := repo.GetDepartures(context.Background(), 1, "down", 280, nil)
	require.NoError(t, err)
	require.Len(t, deps, 2)
	require.Equal(t, "90001", deps[0].Number)
	require.Equal(t, 300, deps[0].Departure)
	require.Equal(t, "90003", deps[1].Number)
}

func TestGetDepartures_WrapsAroundMidnight(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	// From minute 1430 (23:50), next from Dadar should be 90003 at 1450, then 90001 at 330 (wraps)
	deps, err := repo.GetDepartures(context.Background(), 2, "down", 1430, nil)
	require.NoError(t, err)
	require.Len(t, deps, 2)
	require.Equal(t, "90003", deps[0].Number)
	require.Equal(t, 1450, deps[0].Departure)
	require.Equal(t, "90001", deps[1].Number)
	require.Equal(t, 330, deps[1].Departure)
}

func TestGetDepartures_DestinationFilter(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	// From CSMT with destination=Thane should return both trains
	destThane := int64(3)
	deps, err := repo.GetDepartures(context.Background(), 1, "down", 280, &destThane)
	require.NoError(t, err)
	require.Len(t, deps, 2)
	require.Equal(t, "90001", deps[0].Number)

	// From Thane with destination=CSMT should return nothing (CSMT comes before Thane)
	destCSMT := int64(1)
	deps, err = repo.GetDepartures(context.Background(), 3, "down", 340, &destCSMT)
	require.NoError(t, err)
	require.Empty(t, deps)
}

func TestGetDepartures_DirectionFilter(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	// No up trains in fixture
	deps, err := repo.GetDepartures(context.Background(), 1, "up", 280, nil)
	require.NoError(t, err)
	require.Empty(t, deps)
}
