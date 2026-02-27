package station

type Station struct {
	ID   int64  `db:"id"`
	Name string `db:"name"`
	Code string `db:"code"`
}

type Line struct {
	ID        int64  `db:"id"`
	Name      string `db:"name"`
	ShortName string `db:"short_name"`
	Type      string `db:"type"`
}
