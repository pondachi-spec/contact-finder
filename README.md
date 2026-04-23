# Contact Finder

Skip trace property owners to find phone numbers and emails. Dark glassmorphism UI matching Alisha (localhost:3000).

## Stack

- **Backend** — Node.js + Express on port 3003
- **Database** — MongoDB + Mongoose (90-day result cache)
- **Frontend** — React + Vite + Tailwind CSS
- **Skip Trace** — BatchData API (falls back to mock data if key not set)

## Quick Start

### 1. Configure environment

Edit `.env` in the project root:

```env
BATCHDATA_API_KEY=your_key_here          # leave blank for mock data
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/contact-finder?retryWrites=true&w=majority
JWT_SECRET=change-this-secret
PORT=3003
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Run development servers

Terminal 1 — Backend:
```bash
cd backend
npm run dev
```

Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
```

- Backend: http://localhost:3003
- Frontend: http://localhost:5173 (proxies /api → 3003)

### 4. Production build

```bash
cd frontend && npm run build
cd ../backend && npm start   # serves frontend from ../frontend/dist
```

## Features

| Feature | Description |
|---|---|
| Single Lookup | Name + address → phones & emails with confidence scores |
| Bulk Upload | CSV upload, batch-10 processing, live progress bar |
| Confidence Scoring | HIGH (2+ sources) / MEDIUM (1 source, <1yr) / LOW (1 source, >1yr) |
| Result Caching | 90-day MongoDB TTL cache; shows "Cached X days ago" label |
| CSV Export | Download results as CSV (single or bulk) |
| Send to Alisha | POSTs best phone to localhost:3000/api/webhook/propwire |
| Mock Data | Realistic mock if BATCHDATA_API_KEY is unset |

## CSV Format

Upload CSVs with these columns (case-insensitive):

```csv
name,address
John Smith,"123 Main St, Austin TX 78701"
Jane Doe,"456 Oak Ave, Dallas TX 75201"
```

Output CSV appends: Phone 1, Phone 1 Confidence, Phone 2, Phone 2 Confidence, Email 1, Email 1 Confidence, Email 2, Email 2 Confidence, Status.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/lookup | Single skip trace |
| POST | /api/bulk/upload | Upload CSV, returns jobId |
| GET | /api/bulk/status/:jobId | Poll job progress |
| GET | /api/bulk/download/:jobId | Download result CSV |
| GET | /api/health | Health check |
