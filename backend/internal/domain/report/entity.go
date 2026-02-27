package report

type Level string

const (
	LevelLow      Level = "low"
	LevelModerate Level = "moderate"
	LevelCrowded  Level = "crowded"
)

type DelayReport struct {
	TrainNumber  string
	DelayMinutes int
	DeviceID     string
}

type CountReport struct {
	TrainNumber string
	StationID   string
	Level       Level
	DeviceID    string
}

type TrainStatus struct {
	TrainNumber   string
	DelayMinutes  int
	ReporterCount int64
}
