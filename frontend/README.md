# Breathe ESG Frontend

React + Vite app for the Breathe ESG platform. It includes separate views for analysts, auditors, and platform admins.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Configuration

Set `VITE_API_BASE_URL` to your backend URL. For this project, use:

```bash
VITE_API_BASE_URL=https://esg-backend-imi5.onrender.com
```

For Render, use:

```bash
npm install
npm run build
```

Publish directory: `dist`

## Main areas

- Analyst: upload files, review normalized records, and update workflow status.
- Auditor: view locked records and record audit history.
- Admin: manage tenants and users.
