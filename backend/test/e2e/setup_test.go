package e2e_test

import (
	"database/sql"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	goredis "github.com/redis/go-redis/v9"
	_ "modernc.org/sqlite"

	server "github.com/sphericalkat/rush-hour/backend/internal/delivery/http"
	"github.com/sphericalkat/rush-hour/backend/internal/delivery/http/handler"
	"github.com/sphericalkat/rush-hour/backend/internal/infrastructure/hub"
	redisinf "github.com/sphericalkat/rush-hour/backend/internal/infrastructure/redis"
	sqliteinf "github.com/sphericalkat/rush-hour/backend/internal/infrastructure/sqlite"
	"github.com/sphericalkat/rush-hour/backend/internal/usecase"
)

var (
	testServer    *httptest.Server
	testTimetable string // path to temp timetable file for download tests
)

func TestMain(m *testing.M) {
	db := mustSeedDB()
	mr, _ := miniredis.Run()
	redisClient := goredis.NewClient(&goredis.Options{Addr: mr.Addr()})

	// Write a small temp file to stand in for timetable.db in download tests.
	f, err := os.CreateTemp("", "timetable-*.db")
	if err != nil {
		panic(err)
	}
	f.WriteString("sqlite fake content")
	f.Close()
	testTimetable = f.Name()

	stationRepo := sqliteinf.NewStationRepo(db)
	trainRepo := sqliteinf.NewTrainRepo(db)
	reportRepo := redisinf.NewReportRepo(redisClient)
	wsHub := hub.New()

	departuresUC := usecase.NewDepartures(trainRepo, redisClient)
	statusUC := usecase.NewStatus(reportRepo)
	reportUC := usecase.NewReport(reportRepo, wsHub)
	timetableH := handler.NewTimetable(testTimetable, time.Hour)

	r := server.NewRouter(stationRepo, trainRepo, redisClient, departuresUC, statusUC, reportUC, timetableH, wsHub)
	testServer = httptest.NewServer(r)

	code := m.Run()
	testServer.Close()
	mr.Close()
	os.Remove(testTimetable)
	os.Exit(code)
}

const e2eSchema = `
CREATE TABLE IF NOT EXISTS operators (id INTEGER PRIMARY KEY, name TEXT NOT NULL, short_name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS lines (id INTEGER PRIMARY KEY, operator_id INTEGER NOT NULL, name TEXT NOT NULL, short_name TEXT NOT NULL UNIQUE, type TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS stations (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, code TEXT, lat REAL, lng REAL);
CREATE TABLE IF NOT EXISTS line_stations (line_id INTEGER NOT NULL, station_id INTEGER NOT NULL, sequence INTEGER NOT NULL, PRIMARY KEY (line_id, station_id));
CREATE TABLE IF NOT EXISTS trains (id INTEGER PRIMARY KEY, line_id INTEGER NOT NULL, number TEXT NOT NULL, code TEXT, is_ac INTEGER NOT NULL DEFAULT 0, is_fast INTEGER NOT NULL DEFAULT 0, direction TEXT NOT NULL, origin TEXT, destination TEXT, runs_on TEXT NOT NULL DEFAULT 'daily', note TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS stops (id INTEGER PRIMARY KEY, train_id INTEGER NOT NULL, station_id INTEGER NOT NULL, departure INTEGER NOT NULL, stop_sequence INTEGER NOT NULL, platform TEXT, side TEXT);
`

// mustSeedDB creates an in-memory SQLite DB with representative fixture data:
//   - 2 lines (CR Main, WR Main)
//   - 5 stations
//   - 6 trains (mix of directions, one crossing midnight)
func mustSeedDB() *sql.DB {
	db, err := sqliteinf.Open(":memory:")
	if err != nil {
		panic(err)
	}
	if _, err := db.Exec(e2eSchema); err != nil {
		panic(err)
	}
	if _, err := db.Exec(`
		INSERT INTO operators VALUES (1, 'Central Railway', 'CR'), (2, 'Western Railway', 'WR');
		INSERT INTO lines VALUES
			(1, 1, 'Central Line', 'CR-ML', 'suburban_rail'),
			(2, 2, 'Western Line', 'WR-WL', 'suburban_rail');

		INSERT INTO stations VALUES
			(1, 'CSMT',      NULL, NULL, NULL),
			(2, 'Dadar',     NULL, NULL, NULL),
			(3, 'Thane',     NULL, NULL, NULL),
			(4, 'Churchgate', NULL, NULL, NULL),
			(5, 'Borivali',  NULL, NULL, NULL);

		-- CR down trains
		INSERT INTO trains VALUES (1, 1, '90011', 'TNA', 0, 0, 'down', 'CSMT', 'Thane', 'daily', '');
		INSERT INTO stops (id, train_id, station_id, departure, stop_sequence) VALUES (1, 1, 1, 300, 0), (2, 1, 2, 330, 1), (3, 1, 3, 360, 2);

		INSERT INTO trains VALUES (2, 1, '90013', 'TNA', 0, 0, 'down', 'CSMT', 'Thane', 'not_sunday', '');
		INSERT INTO stops (id, train_id, station_id, departure, stop_sequence) VALUES (4, 2, 1, 360, 0), (5, 2, 2, 390, 1), (6, 2, 3, 420, 2);

		-- CR up trains
		INSERT INTO trains VALUES (3, 1, '90012', 'CSMT', 0, 0, 'up', 'Thane', 'CSMT', 'daily', '');
		INSERT INTO stops (id, train_id, station_id, departure, stop_sequence) VALUES (7, 3, 3, 310, 0), (8, 3, 2, 340, 1), (9, 3, 1, 370, 2);

		-- WR down trains
		INSERT INTO trains VALUES (4, 2, '91001', 'BVI', 0, 0, 'down', 'Churchgate', 'Borivali', 'daily', '');
		INSERT INTO stops (id, train_id, station_id, departure, stop_sequence) VALUES (10, 4, 4, 320, 0), (11, 4, 5, 360, 1);

		-- Midnight-crossing train: departs CSMT at 23:40 (1420), Dadar 00:10 (1450)
		INSERT INTO trains VALUES (5, 1, '90099', 'TNA', 0, 0, 'down', 'CSMT', 'Dadar', 'daily', '');
		INSERT INTO stops (id, train_id, station_id, departure, stop_sequence) VALUES (12, 5, 1, 1420, 0), (13, 5, 2, 1450, 1);

		-- AC train
		INSERT INTO trains VALUES (6, 1, '90021', 'TNA', 1, 0, 'down', 'CSMT', 'Thane', 'daily', 'Ladies Special');
		INSERT INTO stops (id, train_id, station_id, departure, stop_sequence) VALUES (14, 6, 1, 480, 0), (15, 6, 2, 510, 1), (16, 6, 3, 540, 2);
	`); err != nil {
		panic(err)
	}
	return db
}
