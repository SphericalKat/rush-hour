package sqlite_test

import (
	"context"
	"database/sql"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/sphericalkat/rush-hour/backend/internal/infrastructure/sqlite"
)

const fixtureSchema = `
CREATE TABLE IF NOT EXISTS operators (id INTEGER PRIMARY KEY, name TEXT NOT NULL, short_name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS lines (id INTEGER PRIMARY KEY, operator_id INTEGER NOT NULL, name TEXT NOT NULL, short_name TEXT NOT NULL UNIQUE, type TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS stations (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, code TEXT, lat REAL, lng REAL);
CREATE TABLE IF NOT EXISTS line_stations (line_id INTEGER NOT NULL, station_id INTEGER NOT NULL, sequence INTEGER NOT NULL, PRIMARY KEY (line_id, station_id));
CREATE TABLE IF NOT EXISTS trains (id INTEGER PRIMARY KEY, line_id INTEGER NOT NULL, number TEXT NOT NULL, code TEXT, is_ac INTEGER NOT NULL DEFAULT 0, is_fast INTEGER NOT NULL DEFAULT 0, direction TEXT NOT NULL, origin TEXT, destination TEXT, runs_on TEXT NOT NULL DEFAULT 'daily', note TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS stops (id INTEGER PRIMARY KEY, train_id INTEGER NOT NULL, station_id INTEGER NOT NULL, departure INTEGER NOT NULL, stop_sequence INTEGER NOT NULL, platform TEXT, side TEXT);
`

func seedTrainDB(t *testing.T) *sql.DB {
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
		INSERT INTO trains VALUES (1, 1, '90001', 'TNA', 0, 0, 'down', 'CSMT', 'Thane', 'daily', '');
		INSERT INTO stops (id, train_id, station_id, departure, stop_sequence) VALUES (1, 1, 1, 300, 0), (2, 1, 2, 330, 1), (3, 1, 3, 360, 2);

		-- Midnight-crossing down train: CSMT 23:40, Dadar 00:10 (= 1450), Thane 00:30 (= 1470)
		INSERT INTO trains VALUES (2, 1, '90003', 'TNA', 0, 0, 'down', 'CSMT', 'Thane', 'daily', '');
		INSERT INTO stops (id, train_id, station_id, departure, stop_sequence) VALUES (4, 2, 1, 1420, 0), (5, 2, 2, 1450, 1), (6, 2, 3, 1470, 2);

		-- Up train: Thane 05:10, Dadar 05:40, CSMT 06:10
		INSERT INTO trains VALUES (3, 1, '90002', 'CSMT', 0, 0, 'up', 'Thane', 'CSMT', 'not_sunday', '');
		INSERT INTO stops (id, train_id, station_id, departure, stop_sequence) VALUES (7, 3, 3, 310, 0), (8, 3, 2, 340, 1), (9, 3, 1, 370, 2);
	`)
	require.NoError(t, err)

	return db
}

func TestGetDepartures_FromCSMT(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	// All departures from CSMT (both directions, no limit)
	deps, err := repo.GetDepartures(context.Background(), 1, nil)
	require.NoError(t, err)
	require.Len(t, deps, 3) // 90001 (down), 90003 (down), 90002 (up)
}

func TestGetDepartures_AllDirections(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	// From Dadar, should return all 3 trains (both directions)
	deps, err := repo.GetDepartures(context.Background(), 2, nil)
	require.NoError(t, err)
	require.Len(t, deps, 3)
}

func TestGetDepartures_DestinationFilter(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	// From CSMT with destination=Thane should return both down trains (up train ends at CSMT)
	destThane := int64(3)
	deps, err := repo.GetDepartures(context.Background(), 1, &destThane)
	require.NoError(t, err)
	require.Len(t, deps, 2)
	require.Equal(t, "90001", deps[0].Number)
	require.Equal(t, "90003", deps[1].Number)

	// From Thane with destination=CSMT, only the up train goes Thane→CSMT
	destCSMT := int64(1)
	deps, err = repo.GetDepartures(context.Background(), 3, &destCSMT)
	require.NoError(t, err)
	require.Len(t, deps, 1)
	require.Equal(t, "90002", deps[0].Number)
}
