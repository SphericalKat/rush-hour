package train

type Departure struct {
	Number    string `db:"number"`
	Code      string `db:"code"`
	IsAC      bool   `db:"is_ac"`
	Direction string `db:"direction"`
	Line      string `db:"line"`
	Departure int    `db:"departure"`
	Station   string `db:"station"`
}
