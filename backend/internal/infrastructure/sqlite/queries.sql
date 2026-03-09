-- name: ListLines :many
SELECT id, name, short_name, type FROM lines ORDER BY id;

-- name: ListStations :many
SELECT id, name, COALESCE(code, '') AS code FROM stations ORDER BY name;

-- name: GetDepartures :many
SELECT t.number, COALESCE(t.code, '') AS code, t.is_ac, t.is_fast, t.direction,
       l.short_name AS line, l.name AS line_name, s.departure, st.name AS station,
       COALESCE(t.origin, '') AS origin, COALESCE(t.destination, '') AS destination,
       COALESCE(s.platform, '') AS platform,
       COALESCE(t.runs_on, 'daily') AS runs_on, COALESCE(t.note, '') AS note
FROM stops s
JOIN trains t    ON s.train_id   = t.id
JOIN stations st ON s.station_id = st.id
JOIN lines l     ON t.line_id    = l.id
WHERE s.station_id = ?
ORDER BY s.departure;

-- name: GetDeparturesWithDestination :many
SELECT t.number, COALESCE(t.code, '') AS code, t.is_ac, t.is_fast, t.direction,
       l.short_name AS line, l.name AS line_name, s.departure, st.name AS station,
       COALESCE(t.origin, '') AS origin, COALESCE(t.destination, '') AS destination,
       COALESCE(s.platform, '') AS platform,
       COALESCE(t.runs_on, 'daily') AS runs_on, COALESCE(t.note, '') AS note
FROM stops s
JOIN trains t    ON s.train_id   = t.id
JOIN stations st ON s.station_id = st.id
JOIN lines l     ON t.line_id    = l.id
WHERE s.station_id = ?
  AND EXISTS (
    SELECT 1 FROM stops s2
    WHERE s2.train_id = t.id
      AND s2.station_id = ?
      AND s2.stop_sequence > s.stop_sequence
  )
ORDER BY s.departure;

-- name: GetStops :many
SELECT st.name AS station, s.departure, s.stop_sequence, COALESCE(s.platform, '') AS platform, COALESCE(s.side, '') AS side
FROM stops s
JOIN stations st ON s.station_id = st.id
JOIN trains t ON s.train_id = t.id
JOIN lines l ON t.line_id = l.id
WHERE t.number = ?
ORDER BY s.stop_sequence;

-- name: GetStopsWithLine :many
SELECT st.name AS station, s.departure, s.stop_sequence, COALESCE(s.platform, '') AS platform, COALESCE(s.side, '') AS side
FROM stops s
JOIN stations st ON s.station_id = st.id
JOIN trains t ON s.train_id = t.id
JOIN lines l ON t.line_id = l.id
WHERE t.number = ? AND l.short_name = ?
ORDER BY s.stop_sequence;

-- name: GetDestination :one
SELECT COALESCE(t.destination, '') AS destination FROM trains t WHERE t.number = ? LIMIT 1;

-- name: GetDestinationWithLine :one
SELECT COALESCE(t.destination, '') AS destination FROM trains t
JOIN lines l ON t.line_id = l.id
WHERE t.number = ? AND l.short_name = ? LIMIT 1;

-- name: GetStopsWithCoords :many
SELECT st.name AS station, st.lat, st.lng, s.stop_sequence
FROM stops s
JOIN stations st ON s.station_id = st.id
JOIN trains t ON s.train_id = t.id
WHERE t.number = ?
ORDER BY s.stop_sequence;

-- name: GetLineStationsWithCoords :many
SELECT st.name AS station, st.lat, st.lng, ls.sequence AS stop_sequence
FROM line_stations ls
JOIN stations st ON ls.station_id = st.id
JOIN trains t ON t.line_id = ls.line_id
WHERE t.number = ?
  AND st.lat IS NOT NULL AND st.lng IS NOT NULL
ORDER BY CASE WHEN t.direction = 'up' THEN -ls.sequence ELSE ls.sequence END;
