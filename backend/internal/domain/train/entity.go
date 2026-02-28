package train

type Departure struct {
	Number      string `db:"number"`
	Code        string `db:"code"`
	IsAC        bool   `db:"is_ac"`
	IsFast      bool   `db:"is_fast"`
	Direction   string `db:"direction"`
	Line        string `db:"line"`
	LineName    string `db:"line_name"`
	Departure   int    `db:"departure"`
	Station     string `db:"station"`
	Origin      string `db:"origin"`
	Destination string `db:"destination"`
}
