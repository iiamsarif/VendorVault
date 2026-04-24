# VendorVault Gujarat

Full-stack industrial B2B vendor marketplace with role-based dashboards.

## Project Structure

- `Frontend/` React + Vite app (`App.jsx` router, all custom CSS in `src/App.css`)
- `Backend/` Node.js + Express + MongoDB native driver (`server.js` entry)

## Environment

Create `.env` in `Backend/` using `Backend/.env.example`.
Create `.env` in `Frontend/` using `Frontend/.env.example`.

## Run Backend

```bash
cd Backend
npm install
npm run dev
```

## Run Frontend

```bash
cd Frontend
npm install
npm run dev
```

## Core Token Keys

- `adminToken`
- `vendorToken`
- `userToken`
