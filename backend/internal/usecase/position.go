package usecase

import (
	"math"

	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
)

// PositionResult describes where a GPS point falls on a train's route.
// Status codes match m-indicator's convention:
//
//	"0" = at station, "1" = left/crossed, "2" = between, "3" = approaching
type PositionResult struct {
	Station  string // nearest or current station name
	Status   string // "0"=at, "1"=left, "2"=between, "3"=approaching
	Msg      string // human-readable, e.g. "At DADAR", "Between DADAR - THANE"
	PrevStn  string // previous station (for "between" / "left")
	NextStn  string // next station (for "between" / "approaching")
	Accurate bool
}

// Distance thresholds in degrees (matching m-indicator's decompiled values).
// ~0.00225 deg ≈ 250m at Mumbai's latitude.
const (
	atStationThresh = 0.00225
	leftThresh      = 0.0063 // just left/crossed a station
	approachThresh  = 0.009  // approaching next station
)

// ResolvePosition projects a GPS coordinate onto a train's ordered route
// and determines the train's position relative to stations.
func ResolvePosition(lat, lng float64, stops []train.StopWithCoord) *PositionResult {
	if len(stops) == 0 {
		return nil
	}

	// Find nearest segment (between consecutive stops)
	bestDist := math.MaxFloat64
	bestIdx := 0

	for i := 0; i < len(stops)-1; i++ {
		_, d := projectOnSegment(lat, lng, stops[i].Lat, stops[i].Lng, stops[i+1].Lat, stops[i+1].Lng)
		if d < bestDist {
			bestDist = d
			bestIdx = i
		}
	}

	// Also check distance to last station (in case closest point is beyond the route)
	lastDist := haversineApprox(lat, lng, stops[len(stops)-1].Lat, stops[len(stops)-1].Lng)
	if lastDist < bestDist {
		bestDist = lastDist
		bestIdx = len(stops) - 1
	}

	// Determine which station the point is closest to
	fromStn := stops[bestIdx]
	var toStn *train.StopWithCoord
	if bestIdx+1 < len(stops) {
		toStn = &stops[bestIdx+1]
	}

	distToFrom := haversineApprox(lat, lng, fromStn.Lat, fromStn.Lng)

	// Check if at a station
	if distToFrom <= atStationThresh {
		return &PositionResult{
			Station:  fromStn.Station,
			Status:   "0",
			Msg:      "At " + fromStn.Station,
			Accurate: true,
		}
	}

	if toStn != nil {
		distToTo := haversineApprox(lat, lng, toStn.Lat, toStn.Lng)

		if distToTo <= atStationThresh {
			return &PositionResult{
				Station:  toStn.Station,
				Status:   "0",
				Msg:      "At " + toStn.Station,
				Accurate: true,
			}
		}

		// Just left the previous station — st "1" in m-indicator
		if distToFrom <= leftThresh {
			return &PositionResult{
				Station:  fromStn.Station,
				Status:   "1",
				Msg:      "Left " + fromStn.Station,
				PrevStn:  fromStn.Station,
				NextStn:  toStn.Station,
				Accurate: true,
			}
		}

		// Approaching the next station — st "3" in m-indicator
		if distToTo <= approachThresh {
			return &PositionResult{
				Station:  toStn.Station,
				Status:   "3",
				Msg:      "Approaching " + toStn.Station,
				NextStn:  toStn.Station,
				PrevStn:  fromStn.Station,
				Accurate: true,
			}
		}

		// Between stations — st "2"
		return &PositionResult{
			Station:  fromStn.Station,
			Status:   "2",
			Msg:      "Between " + fromStn.Station + " - " + toStn.Station,
			PrevStn:  fromStn.Station,
			NextStn:  toStn.Station,
			Accurate: bestDist < 0.02, // ~2km tolerance
		}
	}

	// Beyond last station or no next station
	if distToFrom <= leftThresh {
		return &PositionResult{
			Station:  fromStn.Station,
			Status:   "0",
			Msg:      "At " + fromStn.Station,
			Accurate: true,
		}
	}

	return &PositionResult{
		Station:  fromStn.Station,
		Status:   "0",
		Msg:      "Near " + fromStn.Station,
		Accurate: false,
	}
}

// projectOnSegment projects point P onto line segment AB and returns
// the parameter t (clamped to [0,1]) and the distance from P to the projected point.
func projectOnSegment(pLat, pLng, aLat, aLng, bLat, bLng float64) (t, dist float64) {
	dx := bLat - aLat
	dy := bLng - aLng
	lenSq := dx*dx + dy*dy
	if lenSq == 0 {
		return 0, haversineApprox(pLat, pLng, aLat, aLng)
	}
	t = ((pLat-aLat)*dx + (pLng-aLng)*dy) / lenSq
	if t < 0 {
		t = 0
	} else if t > 1 {
		t = 1
	}
	projLat := aLat + t*dx
	projLng := aLng + t*dy
	return t, haversineApprox(pLat, pLng, projLat, projLng)
}

// haversineApprox returns an approximate distance in degrees.
// Not meters, but consistent with m-indicator's threshold approach.
func haversineApprox(lat1, lng1, lat2, lng2 float64) float64 {
	dLat := lat2 - lat1
	dLng := lng2 - lng1
	return math.Sqrt(dLat*dLat + dLng*dLng)
}
