# BeatsApp

Basic beats marketplace prototype. This repo contains a small Express backend and a static frontend.

Quick start

1. Install backend deps

```bash
cd backend
npm install
```

2. Start server

```bash
npm start
```

3. Serve frontend (or let the backend serve it)

```bash
cd frontend
python3 -m http.server 8080
# open http://localhost:8080/manage.html
```

Notes

- The backend will create `backend/beats.db` on first run using `Database/schema.sql`.
- Environment variables: set `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_*` as needed.
- Passwords are hashed with bcrypt.
