package sqlite

import (
	"github.com/jmoiron/sqlx"
	_ "modernc.org/sqlite"
)

// Open opens the sqlite db at path, applying recommended pragmas
// Pass ":memory:" for an ephemeral in-memory db (WAL will be skipped)
func Open(path string) (*sqlx.DB, error) {
	db, err := sqlx.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	// sqlite allows only one concurrent writer
	db.SetMaxOpenConns(1)
	_, _ = db.Exec(`PRAGMA journal_mode=WAL`)
	if _, err := db.Exec(`PRAGMA foreign_keys=ON`); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}
