# Breathe ESG Frontend

React + Vite app for the Breathe ESG platform. It includes separate views for analysts, auditors, and platform admins.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Configuration

Set `VITE_API_BASE_URL` if your backend is not available through `/api`.

## Main areas

- Analyst: upload files, review normalized records, and update workflow status.
- Auditor: view locked records and record audit history.
- Admin: manage tenants and users.
