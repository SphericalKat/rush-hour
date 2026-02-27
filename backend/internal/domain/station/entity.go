package station

type Station struct {
	ID   int64  `db:"id"   json:"id"`
	Name string `db:"name" json:"name"`
	Code string `db:"code" json:"code"`
}

type Line struct {
	ID        int64  `db:"id"         json:"id"`
	Name      string `db:"name"       json:"name"`
	ShortName string `db:"short_name" json:"short_name"`
	Type      string `db:"type"       json:"type"`
}
