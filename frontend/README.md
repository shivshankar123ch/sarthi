# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


<!-- Backend command -->
npx nodemon

<!-- frontend -->
npm run dev

## Run the frontend with Docker

Build the production image from the repository root, providing the backend API
URL reachable by the user's browser:

```sh
docker build \
  -f frontend/Dockerfile \
  --build-arg VITE_BASE_URL=http://localhost:4000 \
  -t nextdriver-frontend \
  frontend
```

For maps, also pass `--build-arg VITE_MAPBOX_ACCESS_TOKEN=pk...` with your
public Mapbox browser token.

Run the frontend on port 8080:

```sh
docker run --rm -p 8080:80 nextdriver-frontend
```

Open `http://localhost:8080`. Vite embeds these values into the static build,
so changing them requires rebuilding the image. Never pass backend secrets as
frontend build arguments.

The root `docker-compose.yml` also defines a `frontend` service. Start it with:

```sh
docker compose up --build frontend
```

It is served at `http://localhost:8080`. Compose defaults the browser API URL
to `http://localhost:4000`; set `VITE_BASE_URL` in the root Compose `.env` file
if the backend is hosted at another browser-reachable URL. To enable maps, set
`VITE_MAPBOX_ACCESS_TOKEN` there as well.

## 2Factor Phone OTP login

Set `VITE_BASE_URL` in the frontend `.env` to the backend API URL. Configure
`TWO_FACTOR_API_KEY` and `JWT_SECRET` in `Backend/.env`; the 2Factor key is used
only by the backend and must never be added to frontend variables. The browser
requests and verifies OTPs through the backend, which sends and validates SMS
codes with 2Factor. Successful verification on the owner and captain login
pages opens the corresponding signup page.

Set `VITE_MAPBOX_ACCESS_TOKEN` in `Frontend/.env` to a Mapbox **public**
(`pk...`) access token to render maps. Keep the backend `MAPBOX_SECRET_TOKEN`
private; it is not safe to use in browser code. Captain GPS updates are sent to
the backend, streamed through Kafka, and forwarded to the rider over Socket.IO
for live marker updates.
