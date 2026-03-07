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
	Platform    string `db:"platform"`
	RunsOn      string `db:"runs_on"`
	Note        string `db:"note"`
}

type Stop struct {
	Station      string `db:"station"`
	Departure    int    `db:"departure"`
	StopSequence int    `db:"stop_sequence"`
	Platform     string `db:"platform"`
	Side         string `db:"side"`
}

type StopWithCoord struct {
	Station string  `db:"station"`
	Lat     float64 `db:"lat"`
	Lng     float64 `db:"lng"`
	Seq     int     `db:"stop_sequence"`
}
