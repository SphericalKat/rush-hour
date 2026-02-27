package sqlite

import (
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

// Open opens the SQLite database at path, applying recommended pragmas.
// Pass ":memory:" for an ephemeral in-memory database (WAL is skipped).
func Open(path string) (*sqlx.DB, error) {
	db, err := sqlx.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	// SQLite allows only one concurrent writer; cap the pool accordingly.
	db.SetMaxOpenConns(1)
	// WAL is a no-op for in-memory databases; ignore the error.
	db.Exec(`PRAGMA journal_mode=WAL`) //nolint:errcheck
	if _, err := db.Exec(`PRAGMA foreign_keys=ON`); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}
