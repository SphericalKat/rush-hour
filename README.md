# rush hour

Train tracker for Mumbai suburban railways which covers Central, Western, Harbour, Trans-Harbour, and Port lines.

## Features

- Source/Destination filtering
- Live train position from crowdsourced GPS, updates every 15s
- Background location sharing 
- Favorites for your daily trains
- Route timeline with live position overlay

## Structure

```
parser/     turns official timetable PDFs into SQLite
backend/    Go API server + WebSocket
mobile/     Expo/React Native app
deploy/     Ansible playbook to deploy
```

## Running it

Backend needs a timetable DB and Redis:

```
ADDR=:8080
TIMETABLE_DB_PATH=./timetable.db
REDIS_URL=redis://localhost:6379
```

Mobile is a standard react native (expo) app. Run `npm install` and `npx expo run:android` or `npx expo run:ios` depending on your preferred platform.

See `parser/` for generating the timetable DB from CR/WR PDFs.

## License

MIT
