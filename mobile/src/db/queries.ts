import type { SQLiteDatabase } from 'expo-sqlite';
import type { Departure, DepartureWithArrival, Line, RouteStop, Station, TrainStop, TransferRoute } from '../api/types';
import { stationsBetween } from './routes';

export async function listStations(db: SQLiteDatabase): Promise<Station[]> {
  return db.getAllAsync<Station>(
    `SELECT id, name, COALESCE(code, '') AS code FROM stations ORDER BY name`,
  );
}

export async function listLines(db: SQLiteDatabase): Promise<Line[]> {
  return db.getAllAsync<Line>(
    `SELECT id, name, short_name, type FROM lines ORDER BY id`,
  );
}

export async function getDepartures(
  db: SQLiteDatabase,
  stationId: number,
  destinationId?: number,
): Promise<Departure[]> {
  if (destinationId != null) {
    return db.getAllAsync<Departure>(
      `SELECT t.number, COALESCE(t.code, '') AS code, t.is_ac, t.is_fast, t.direction,
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
       ORDER BY s.departure`,
      [stationId, destinationId],
    );
  }

  return db.getAllAsync<Departure>(
    `SELECT t.number, COALESCE(t.code, '') AS code, t.is_ac, t.is_fast, t.direction,
            l.short_name AS line, l.name AS line_name, s.departure, st.name AS station,
            COALESCE(t.origin, '') AS origin, COALESCE(t.destination, '') AS destination,
            COALESCE(s.platform, '') AS platform,
            COALESCE(t.runs_on, 'daily') AS runs_on, COALESCE(t.note, '') AS note
     FROM stops s
     JOIN trains t    ON s.train_id   = t.id
     JOIN stations st ON s.station_id = st.id
     JOIN lines l     ON t.line_id    = l.id
     WHERE s.station_id = ?
     ORDER BY s.departure`,
    [stationId],
  );
}

// Stations reachable from source that also connect to destination via a different line.
export async function getTransferStations(
  db: SQLiteDatabase,
  sourceId: number,
  destId: number,
): Promise<{ id: number; name: string }[]> {
  return db.getAllAsync<{ id: number; name: string }>(
    `SELECT DISTINCT s.id, s.name
     FROM stations s
     JOIN line_stations ls1 ON ls1.station_id = s.id
     JOIN line_stations ls2 ON ls2.station_id = s.id
     WHERE ls1.line_id IN (SELECT line_id FROM line_stations WHERE station_id = ?)
       AND ls2.line_id IN (SELECT line_id FROM line_stations WHERE station_id = ?)
       AND ls1.line_id != ls2.line_id
       AND s.id != ?
       AND s.id != ?`,
    [sourceId, destId, sourceId, destId],
  );
}

// Departures from one station to another, including arrival time at the destination station.
// When minDeparture is provided, only returns trains departing at or after that time.
export async function getDeparturesWithArrival(
  db: SQLiteDatabase,
  fromStationId: number,
  toStationId: number,
  minDeparture?: number,
): Promise<DepartureWithArrival[]> {
  const hasMin = minDeparture != null;
  return db.getAllAsync<DepartureWithArrival>(
    `SELECT t.number, COALESCE(t.code, '') AS code, t.is_ac, t.is_fast, t.direction,
            l.short_name AS line, l.name AS line_name, s_dep.departure,
            st_dep.name AS station,
            COALESCE(t.origin, '') AS origin, COALESCE(t.destination, '') AS destination,
            COALESCE(s_dep.platform, '') AS platform,
            COALESCE(t.runs_on, 'daily') AS runs_on, COALESCE(t.note, '') AS note,
            s_arr.departure AS arrival
     FROM stops s_dep
     JOIN trains t ON s_dep.train_id = t.id
     JOIN stations st_dep ON s_dep.station_id = st_dep.id
     JOIN lines l ON t.line_id = l.id
     JOIN stops s_arr ON s_arr.train_id = t.id AND s_arr.station_id = ?
     WHERE s_dep.station_id = ?
       AND s_arr.stop_sequence > s_dep.stop_sequence
       ${hasMin ? 'AND s_dep.departure >= ?' : ''}
     ORDER BY s_dep.departure`,
    hasMin ? [toStationId, fromStationId, minDeparture] : [toStationId, fromStationId],
  );
}

const TRANSFER_BUFFER_MIN = 5;

// Build transfer routes through a single transfer station.
// Only considers leg1 trains departing at or after the current time (minus a small buffer).
export async function getTransferRoutes(
  db: SQLiteDatabase,
  sourceId: number,
  destId: number,
): Promise<TransferRoute[]> {
  const transferStations = await getTransferStations(db, sourceId, destId);
  if (transferStations.length === 0) return [];

  const now = new Date();
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  // Show a few trains that just left (5 min buffer)
  const minLeg1 = Math.max(0, nowMinute - 5);

  const routes: TransferRoute[] = [];

  for (const ts of transferStations) {
    const [leg1Trains, leg2Trains] = await Promise.all([
      getDeparturesWithArrival(db, sourceId, ts.id, minLeg1),
      getDeparturesWithArrival(db, ts.id, destId),
    ]);

    if (leg1Trains.length === 0 || leg2Trains.length === 0) continue;

    for (const l1 of leg1Trains) {
      const earliest = l1.arrival + TRANSFER_BUFFER_MIN;

      // Linear scan is fine for the dataset size
      const l2 = leg2Trains.find(t => t.departure >= earliest);
      if (!l2) continue;

      const waitMinutes = l2.departure - l1.arrival;
      const totalMinutes = l2.arrival - l1.departure;

      routes.push({
        transferStation: ts.name,
        leg1: l1,
        leg2: l2,
        waitMinutes,
        totalMinutes,
        arrivalTime: l2.arrival,
      });
    }
  }

  routes.sort((a, b) => a.leg1.departure - b.leg1.departure);

  return routes;
}

export async function getTrainStops(
  db: SQLiteDatabase,
  trainNumber: string,
  line?: string,
): Promise<TrainStop[]> {
  if (line) {
    return db.getAllAsync<TrainStop>(
      `SELECT st.name AS station, s.departure, s.stop_sequence, COALESCE(s.platform, '') AS platform, COALESCE(s.side, '') AS side
       FROM stops s
       JOIN stations st ON s.station_id = st.id
       JOIN trains t ON s.train_id = t.id
       JOIN lines l ON t.line_id = l.id
       WHERE t.number = ? AND l.short_name = ?
       ORDER BY s.stop_sequence`,
      [trainNumber, line],
    );
  }

  return db.getAllAsync<TrainStop>(
    `SELECT st.name AS station, s.departure, s.stop_sequence, COALESCE(s.platform, '') AS platform, COALESCE(s.side, '') AS side
     FROM stops s
     JOIN stations st ON s.station_id = st.id
     JOIN trains t ON s.train_id = t.id
     JOIN lines l ON t.line_id = l.id
     WHERE t.number = ?
     ORDER BY s.stop_sequence`,
    [trainNumber],
  );
}

async function getDestination(
  db: SQLiteDatabase,
  trainNumber: string,
  line?: string,
): Promise<string> {
  const query = line
    ? `SELECT COALESCE(t.destination, '') AS destination FROM trains t JOIN lines l ON t.line_id = l.id WHERE t.number = ? AND l.short_name = ? LIMIT 1`
    : `SELECT COALESCE(t.destination, '') AS destination FROM trains t WHERE t.number = ? LIMIT 1`;
  const params = line ? [trainNumber, line] : [trainNumber];
  const row = await db.getFirstAsync<{ destination: string }>(query, params);
  return row?.destination ?? '';
}

export async function getTrainRoute(
  db: SQLiteDatabase,
  trainNumber: string,
  line?: string,
): Promise<RouteStop[]> {
  const stops = await getTrainStops(db, trainNumber, line);
  if (stops.length === 0) return [];

  // Truncate at declared destination
  const dest = await getDestination(db, trainNumber, line);
  let truncated = stops;
  if (dest) {
    const idx = stops.findIndex(s => s.station === dest);
    if (idx >= 0) {
      truncated = stops.slice(0, idx + 1);
    }
  }

  const route: RouteStop[] = [];
  let seq = 0;

  for (let i = 0; i < truncated.length; i++) {
    const s = truncated[i];
    route.push({
      station: s.station,
      departure: s.departure,
      stop_sequence: seq,
      platform: s.platform,
      side: s.side,
      is_stop: true,
    });
    seq++;

    // Insert pass-through stations between consecutive stops
    if (i < truncated.length - 1) {
      const between = stationsBetween(s.station, truncated[i + 1].station);
      if (between) {
        for (const name of between) {
          route.push({
            station: name,
            stop_sequence: seq,
            is_stop: false,
          });
          seq++;
        }
      }
    }
  }

  return route;
}
