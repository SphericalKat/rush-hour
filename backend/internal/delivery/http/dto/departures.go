package dto

type DepartureResponse struct {
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
}
