package server

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/redis/go-redis/v9"
	"github.com/sphericalkat/rush-hour/backend/internal/delivery/http/handler"
	"github.com/sphericalkat/rush-hour/backend/internal/delivery/http/middleware"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/station"
	"github.com/sphericalkat/rush-hour/backend/internal/domain/train"
	"github.com/sphericalkat/rush-hour/backend/internal/infrastructure/hub"
	"github.com/sphericalkat/rush-hour/backend/internal/usecase"
)

func NewRouter(
	stationRepo station.Repository,
	trainRepo train.Repository,
	redisClient *redis.Client,
	departuresUC *usecase.DeparturesUseCase,
	statusUC *usecase.StatusUseCase,
	reportUC *usecase.ReportUseCase,
	timetableH *handler.TimetableHandler,
	wsHub *hub.Hub,
) http.Handler {
	stationH := handler.NewStation(stationRepo)
	departuresH := handler.NewDepartures(departuresUC)
	statusH := handler.NewStatus(statusUC)
	reportH := handler.NewReport(reportUC)
	liveH := handler.NewLive(trainRepo, redisClient)
	locationH := handler.NewLocation(trainRepo, redisClient)
	wsH := handler.NewWS(wsHub)

	r := chi.NewRouter()
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.Logger)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/lines", stationH.ListLines)
		r.Get("/stations", stationH.ListStations)
		r.Get("/stations/{id}/departures", departuresH.GetDepartures)
		r.Get("/trains/{number}/status", statusH.GetStatus)
		r.Get("/trains/{number}/live", liveH.GetLiveTrainInfo)
		r.Get("/trains/{number}/stops", liveH.GetStops)
		r.Post("/trains/{number}/location", locationH.PushLocation)

		r.Get("/live/trains", liveH.GetAllLiveTrains)

		r.Post("/reports/delay", reportH.SubmitDelay)
		r.Post("/reports/count", reportH.SubmitCount)

		r.Get("/timetable/version", timetableH.GetVersion)
		r.Get("/timetable/download", timetableH.Download)
	})

	r.Get("/ws", wsH.Handle)

	return r
}
