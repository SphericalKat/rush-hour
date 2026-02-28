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
CREATE TABLE IF NOT EXISTS trains (id INTEGER PRIMARY KEY, line_id INTEGER NOT NULL, number TEXT NOT NULL, code TEXT, is_ac INTEGER NOT NULL DEFAULT 0, direction TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS stops (id INTEGER PRIMARY KEY, train_id INTEGER NOT NULL, station_id INTEGER NOT NULL, departure INTEGER NOT NULL, stop_sequence INTEGER NOT NULL);
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
		INSERT INTO lines VALUES (1, 1, 'Main Line', 'CR-ML', 'suburban_rail');
		INSERT INTO stations VALUES (1, 'CSMT', NULL, NULL, NULL), (2, 'Dadar', NULL, NULL, NULL), (3, 'Thane', NULL, NULL, NULL);

		-- Regular down train: CSMT 05:00, Dadar 05:30, Thane 06:00
		INSERT INTO trains VALUES (1, 1, '90001', 'TNA', 0, 'down');
		INSERT INTO stops VALUES (1, 1, 1, 300, 0), (2, 1, 2, 330, 1), (3, 1, 3, 360, 2);

		-- Midnight-crossing down train: CSMT 23:40, Dadar 00:10 (= 1450), Thane 00:30 (= 1470)
		INSERT INTO trains VALUES (2, 1, '90003', 'TNA', 0, 'down');
		INSERT INTO stops VALUES (4, 2, 1, 1420, 0), (5, 2, 2, 1450, 1), (6, 2, 3, 1470, 2);
	`)
	require.NoError(t, err)

	return db
}

func TestGetDepartures_NormalWindow(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	// window 280–340 should include the 05:00 departure (300) but not Dadar (330 < 340 yes, actually 330 is in window)
	deps, err := repo.GetDepartures(context.Background(), 1, "down", 280, 340)
	require.NoError(t, err)
	require.Len(t, deps, 1)
	require.Equal(t, "90001", deps[0].Number)
	require.Equal(t, 300, deps[0].Departure)
	require.Equal(t, "CSMT", deps[0].Origin)
	require.Equal(t, "Thane", deps[0].Destination)
}

func TestGetDepartures_EmptyWindow(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	deps, err := repo.GetDepartures(context.Background(), 1, "down", 700, 760)
	require.NoError(t, err)
	require.Empty(t, deps)
}

func TestGetDepartures_MidnightWrap(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	// Window 1400–1460 (until=1460 > 1440):
	//   normal clause catches train 90003's CSMT stop at 1420 (1400 ≤ 1420 < 1460)
	//   wraparound clause catches stops with departure < (1460-1440)=20 — none in fixture
	// train 90001's CSMT stop is at 300, which is outside this window
	deps, err := repo.GetDepartures(context.Background(), 1, "down", 1400, 1460)
	require.NoError(t, err)
	require.Len(t, deps, 1)
	require.Equal(t, "90003", deps[0].Number)
	require.Equal(t, "CSMT", deps[0].Origin)
	require.Equal(t, "Thane", deps[0].Destination)
}

func TestGetDepartures_MidnightWrap_CrossesMidnight(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	// Window 1430–1500 (until=1500 > 1440): should include train 90003's Dadar stop
	// at 1450 (via normal clause) and would include stops with departure < 60 via wraparound.
	deps, err := repo.GetDepartures(context.Background(), 2, "down", 1430, 1500)
	require.NoError(t, err)
	require.Len(t, deps, 1)
	require.Equal(t, "90003", deps[0].Number)
	require.Equal(t, 1450, deps[0].Departure)
}

func TestGetDepartures_DirectionFilter(t *testing.T) {
	db := seedTrainDB(t)
	repo := sqlite.NewTrainRepo(db)

	// No up trains in fixture, so "up" direction should return nothing from station 1
	deps, err := repo.GetDepartures(context.Background(), 1, "up", 280, 400)
	require.NoError(t, err)
	require.Empty(t, deps)
}
