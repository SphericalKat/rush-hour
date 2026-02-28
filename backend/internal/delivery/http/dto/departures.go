package dto

type DepartureResponse struct {
	Number      string `json:"number"`
	Code        string `json:"code"`
	IsAC        bool   `json:"is_ac"`
	Direction   string `json:"direction"`
	Line        string `json:"line"`
	Departure   int    `json:"departure"`
	Station     string `json:"station"`
	Origin      string `json:"origin"`
	Destination string `json:"destination"`
}
