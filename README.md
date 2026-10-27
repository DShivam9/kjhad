# UK Day-Ahead Wind Generation Decision Platform & Forecast Evaluation Desk

An institutional-grade decision support platform built for UK energy utility trading desks buying wholesale electricity in the Day-Ahead Market (EPEX SPOT / Nord Pool) for **January 2026**.

The platform ingests live, metered National Grid ESO / Elexon BMRS stream data to eliminate look-ahead bias, evaluate forecast accuracy across all 1,488 settlement periods, and size dispatchable thermal backup buffers to hedge against costly Balancing Mechanism cashout penalties.

### 🌐 Live Deployment Links
- **Backend API & Swagger Docs**: [https://grid-backend-xee3.onrender.com/docs](https://grid-backend-xee3.onrender.com/docs)
- **API Health Check**: [https://grid-backend-xee3.onrender.com/api/health](https://grid-backend-xee3.onrender.com/api/health)
- **Frontend Portal**: *(Deploying on Vercel)*

---

## 1. Executive Summary & Market Findings

UK energy utilities must procure power on Day D-1 before the Day-Ahead auction cutoff (typically **11:00 UTC**). Renewable wind is intermittent and non-dispatchable; utilities must forecast wind delivery to calculate their residual demand for dispatchable thermal generation (CCGT/peakers).

Evaluating the **1,488 half-hour settlement periods** of **January 2026** revealed a critical domain reality:

- **Mean Absolute Error (MAE)**: **2,108.5 MW** (11.8% of national wind capacity)
- **Root Mean Square Error (RMSE)**: **2,611.2 MW** (heavily penalizes storm-driven forecast collapses)
- **Mean Absolute Percentage Error (MAPE)**: **21.94%**
- **Directional Bias (Mean Bias Error)**: **+1,839.5 MW** (systematic national overforecasting)

> **Key Commercial Insight**: National wind forecasts consistently overpredict actual generation by nearly **1.84 GW** on average. A wholesale trading desk bidding 1:1 against wind forecasts without a quantitative thermal buffer would end up structurally short in **78% of settlement periods**, paying steep National Grid Balancing Mechanism (BM) System Buy Price cashout penalties.

---

## 2. Platform Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA PIPELINE (Backend)                         │
│                                                                        │
│   Elexon BMRS Stream API                                              │
│   ├── FUELHH (Half-hourly metered generation: WIND)                    │
│   └── WINDFOR (Batched wind forecast stream)                           │
│                                                                        │
│   Data Store & Gate Closure Engine (Python / Pandas / FastAPI)         │
│   ├── Filter publish_time <= 11:00 UTC (D-1) (Zero Look-Ahead Bias)    │
│   ├── Linear Interpolation for 48 half-hour settlement periods        │
│   └── In-Memory Store: 1,490 actuals & 19,272 forecast records (<10ms) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ JSON REST API
┌───────────────────────────────────▼────────────────────────────────────┐
│                        FRONTEND PORTAL (React 19)                      │
│                                                                        │
│   1. Day-Ahead Decision View                                           │
│      • Bklit Time-Series Area Chart (Forecast vs Actual Generation)   │
│      • Real-time Cutoff Hour & Delivery Date Picker                    │
│      • Dispatchable Thermal Buy Order Calculator                      │
│                                                                        │
│   2. Quantitative Error Analytics                                      │
│      • Bklit Error Distribution Histogram (P10, P50, P90 percentiles)   │
│      • Bklit Diurnal Error Profile (48 settlement periods, 00:00-23:30)│
│      • January 1-31 Daily Error Trend & Storm Volatility Peak Days    │
│                                                                        │
│   3. Thermal Risk Buffer Tool                                          │
│      • P50 / P80 / P90 / P95 Confidence Level Selection                │
│      • Quantified Step-by-Step Thermal Procurement Recommendation      │
│      • Balancing Mechanism Penalty Avoidance Estimator (£k saved)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory & File Map

```
gridassign/
├── backend/
│   ├── api/
│   │   ├── routes_forecast.py       # Day-Ahead schedule endpoint
│   │   └── routes_analytics.py      # Monthly summary & daily breakdown endpoints
│   ├── data/
│   │   └── raw/                     # Cached Elexon BMRS JSON streams (Jan 2026)
│   │       ├── FUELHH_actuals_jan2026.json
│   │       └── WINDFOR_forecasts_jan2026.json
│   ├── models/
│   │   └── schemas.py               # Pydantic v2 request/response schemas
│   ├── services/
│   │   ├── elexon_client.py         # Resilient Elexon API client (rate limits/retries)
│   │   ├── data_pipeline.py         # Gate-closure matching & in-memory pandas store
│   │   └── error_metrics.py         # Quantitative statistical engine (MAE, RMSE, MAPE, MBE)
│   ├── Dockerfile                   # Python 3.11-slim container
│   ├── main.py                      # FastAPI app entry point & CORS configuration
│   ├── Procfile                     # Heroku / Render deployment specification
│   ├── requirements.txt             # Python dependencies
│   ├── runtime.txt                  # Python runtime specification (3.11.8)
│   └── verify_core.py               # Automated verification script
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts            # Typed HTTP client with environment resolution
│   │   │   └── types.ts             # TypeScript interfaces matching backend models
│   │   ├── components/
│   │   │   ├── analytics/
│   │   │   │   └── QuantitativeErrorView.tsx # Histograms & diurnal curves
│   │   │   ├── charts/              # Third-party: Bklit UI charting primitives (not our own, https://bklit.com)
│   │   │   │   ├── area-chart.tsx
│   │   │   │   ├── bar-chart.tsx
│   │   │   │   ├── line-chart.tsx
│   │   │   │   └── ...
│   │   │   ├── decision/
│   │   │   │   └── ThermalRiskBufferView.tsx # Empirical risk sizing tool
│   │   │   ├── forecast/
│   │   │   │   └── DayAheadView.tsx # Day D-1 forecast vs actuals Bklit view
│   │   │   └── layout/
│   │   │       └── Sidebar.tsx      # Collapsible & expandable trading desk sidebar navigation
│   │   ├── App.tsx                  # Main 3-tab portal layout & navigation
│   │   ├── index.css                # Design tokens & color system
│   │   └── main.tsx                 # React DOM root mounting
│   ├── Dockerfile                   # Multi-stage build (Node 20 -> Nginx alpine)
│   ├── nginx.conf                   # Nginx reverse proxy & SPA fallback
│   ├── package.json                 # React 19, Bklit, Visx, Motion, Tailwind
│   ├── tsconfig.json                # Strict TypeScript configuration
│   └── vercel.json                  # Vercel SPA routing rewrites
│
├── docker-compose.yml               # 1-command container orchestration
├── PROJECT_BLUEPRINT.md             # Complete technical architecture specification
├── DEMO_SCRIPT.md                   # 10-minute video presentation script
└── README.md                        # Documentation
```

---

## 4. How to Start the Application

### Option A: Using Docker (Recommended)

Run both the FastAPI backend and React frontend with a single command:

```bash
docker compose up --build
```

- **Frontend Portal**: `http://localhost:3000`
- **Backend API & Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

---

### Option B: Running Locally Without Docker

#### 1. Start the Backend (Python 3.11+)

```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Start the Frontend (Node.js 18+)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 5. Mathematical Formulations & Methodology

### Gate Closure & Look-Ahead Bias Prevention
In the UK EPEX SPOT Day-Ahead Auction, order books close at **11:00 UTC on Day D-1**. The platform enforces this gate closure:
$$\text{PublishTime} \le \text{DeliveryDate}_{D-1} \text{ 11:00:00 UTC}$$
Only forecasts published prior to this timestamp are admitted.

### Quantitative Error Metrics
For settlement periods $i = 1, \dots, N$:

1. **Mean Absolute Error (MAE)**:
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} \left| F_i - A_i \right|$$

2. **Root Mean Square Error (RMSE)**:
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)^2}$$

3. **Mean Absolute Percentage Error (MAPE)**:
   $$\text{MAPE} = \frac{100\%}{N_{\text{active}}} \sum_{A_i > 0} \frac{\left| F_i - A_i \right|}{A_i}$$

4. **Mean Bias Error (MBE / Directional Bias)**:
   $$\text{MBE} = \frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)$$

---

## 6. Deployment Guide

### Frontend Deployment (Vercel)
1. Push this repository to GitHub.
2. In the Vercel dashboard, click **Add New Project** and select the repository.
3. Set **Root Directory** to `frontend`.
4. Add environment variable:
   - `VITE_API_URL`: URL of your deployed backend (e.g. `https://grid-backend.onrender.com`).
5. Deploy. The `vercel.json` ensures all client routes resolve correctly.

### Backend Deployment (Render / Heroku)
1. Connect the repository to Render or Heroku.
2. Root directory: `backend` or use the provided `Procfile`:
   ```
   web: uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
   ```
3. Set Python version to `3.11.8` via `runtime.txt`.

---

## 7. AI Tools Disclosure

As requested in the project brief, this application was built with the assistance of Google Antigravity AI, utilizing:
- Data pipeline engineering for Elexon BMRS API integration and look-ahead bias validation.
- Quantitative statistical error formulation in Python (Pandas/NumPy).
- Frontend design and integration using Bklit UI charting libraries (Visx / Motion).
- Full end-to-end containerization and verification.

---

## 8. Third-Party Attributions & Open Source Acknowledgments

### Bklit UI Chart Library (`frontend/src/components/charts/`)
- **Origin**: [Bklit UI](https://bklit.com) | [Documentation & Components](https://bklit.com/docs/installation)
- **Directory**: [`frontend/src/components/charts/`](file:///d:/gridassign/frontend/src/components/charts)
- **Attribution Notice**: The components in the `frontend/src/components/charts/` directory (including `time-series-chart-shell.tsx`, `area-chart.tsx`, `bar-chart.tsx`, `line-chart.tsx`, axis scalers, pattern generators, and tooltip animations) are sourced directly from the **Bklit UI** open-source component collection (built on top of `@visx` and `motion`).
- **Originality Clarification**: These chart components are **not our own creation**. They were imported from Bklit to serve as high-performance SVG/canvas visualization primitives, which we configured, styled, and wired to our Elexon BMRS energy forecasting backend data feeds. All credit for the underlying chart architecture goes to the authors and maintainers of Bklit UI.

