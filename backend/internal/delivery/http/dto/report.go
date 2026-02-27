package dto

type DelayReportRequest struct {
	TrainNumber  string `json:"train_number"`
	DelayMinutes int    `json:"delay_minutes"`
	DeviceID     string `json:"device_id"`
}

type CountReportRequest struct {
	TrainNumber string `json:"train_number"`
	StationID   string `json:"station_id"`
	Level       string `json:"level"`
	DeviceID    string `json:"device_id"`
}

type TrainStatusResponse struct {
	TrainNumber   string `json:"train_number"`
	DelayMinutes  int    `json:"delay_minutes"`
	ReporterCount int64  `json:"reporter_count"`
}
