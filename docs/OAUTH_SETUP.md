# OAuth2 (Google) Setup

## How it works

1. User clicks "Google" on the login page → browser goes to backend: `GET /oauth2/authorization/google`.
2. Backend redirects to Google; user signs in with Google.
3. Google redirects back to backend: `GET /login/oauth2/code/google` (Spring default).
4. Backend `OAuth2LoginSuccessHandler` runs: finds/creates user by email, issues JWT access + refresh tokens, then redirects to the **frontend** URL with tokens in query params: `{OAUTH2_REDIRECT_URI}?accessToken=...&refreshToken=...`.
5. Frontend Auth page reads `accessToken` and `refreshToken` from the URL, calls `applyOAuthTokens()`, then clears the URL and continues as logged-in.

## Backend configuration (frontend 8081, backend 8080)

In `LMS/src/main/resources/application.yaml`:

- **Server port**: Backend runs on **8080** by default (`server.port: 8080`). Override with `SERVER_PORT` if needed. (Port 808 can cause `BindException: Permission denied` on some systems.)
- **Google OAuth**: Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)). Or use the in-file defaults for local dev.
- **Authorized redirect URI in Google Console**: This is the **backend** URL that Google redirects to after login. It **must** match your backend port:
  - Backend on **8080** (default): `http://localhost:8080/login/oauth2/code/google`
  - Production: `https://your-api-domain.com/login/oauth2/code/google`
- **Frontend redirect** (`app.oauth2.redirect-uri`): Where the backend sends the user with tokens. Default: `http://localhost:8081/auth` (frontend on 8081). Set `OAUTH2_REDIRECT_URI` in production.
- **CORS** (`app.cors.allowed-origins`): Must include the frontend origin. Default: `http://localhost:8081`. Set `CORS_ALLOWED_ORIGINS` in production.

## Frontend (running on 8081)

- The Auth page (`/auth`) handles `?accessToken=...&refreshToken=...` and calls `applyOAuthTokens()`.
- The Google button uses `getApiBaseUrl()`, which defaults to `http://localhost:8080`. If your backend is on another port, set **`VITE_API_BASE_URL`** in `.env` (e.g. `VITE_API_BASE_URL=http://localhost:8080`).

## Checklist (frontend 8081, backend 8080)

1. Create OAuth 2.0 Client ID (Web application) in Google Cloud Console.
2. Add **Authorized redirect URI**: `http://localhost:8080/login/oauth2/code/google`.
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (or use defaults in `application.yaml`).
4. Backend: `app.oauth2.redirect-uri` = `http://localhost:8081/auth`, CORS = `http://localhost:8081` (already set).
5. Frontend: default API URL is `http://localhost:8080`; override with `VITE_API_BASE_URL` if needed.
