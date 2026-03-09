package train

type Departure struct {
	Number      string `json:"number"`
	Code        string `json:"code"`
	IsAC        bool   `json:"is_ac"`
	IsFast      bool   `json:"is_fast"`
	Direction   string `json:"direction"`
	Line        string `json:"line"`
	LineName    string `json:"line_name"`
	Departure   int    `json:"departure"`
	Station     string `json:"station"`
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
	Platform    string `json:"platform"`
	RunsOn      string `json:"runs_on"`
	Note        string `json:"note"`
}

type Stop struct {
	Station      string `json:"station"`
	Departure    int    `json:"departure"`
	StopSequence int    `json:"stop_sequence"`
	Platform     string `json:"platform"`
	Side         string `json:"side"`
}

type StopWithCoord struct {
	Station string  `json:"station"`
	Lat     float64 `json:"lat"`
	Lng     float64 `json:"lng"`
	Seq     int     `json:"stop_sequence"`
}
