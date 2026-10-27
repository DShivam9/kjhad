# UK Wind Power Trading & Day-Ahead Forecast Evaluation Desk

A decision-support platform designed for UK power traders and energy analysts. It evaluates day-ahead wind forecasts against actual metered grid generation across all 1,488 half-hour settlement periods of **January 2026**, helping trading desks size backup thermal generation and avoid costly grid penalties.

### 🌐 Live Deployment
- **Frontend Portal (Vercel)**: [https://frontend-woad-six-16.vercel.app/](https://frontend-woad-six-16.vercel.app/)
- **Backend API & Swagger Docs (Render)**: [https://grid-backend-xee3.onrender.com/docs](https://grid-backend-xee3.onrender.com/docs)
- **API Health Check**: [https://grid-backend-xee3.onrender.com/api/health](https://grid-backend-xee3.onrender.com/api/health)

---

## The Problem: Why Forecast Accuracy Matters

In the UK Day-Ahead power market (EPEX SPOT / Nord Pool), suppliers and trading desks must lock in their power procurement orders by **11:00 UTC on Day D-1** (the day before actual delivery).

Because wind power fluctuates with the weather, trading desks need accurate forecasts to determine how much dispatchable thermal backup (such as gas-fired CCGT) they need to buy. If the wind underdelivers, the utility is left short and must pay steep cashout penalties to National Grid ESO under the Balancing Mechanism.

### Key Market Findings (January 2026)

Analyzing all 1,488 settlement periods in January 2026 revealed a clear, systematic trend:

- **Consistent Overforecasting (+1,839.5 MW average bias)**: Day-ahead forecasts overpromised generation in nearly **78%** of all half-hour settlement periods.
- **Average Forecast Miss (MAE: 2,108.5 MW)**: An average deviation of ~11.8% relative to total national wind capacity.
- **Storm Shock Sensitivity (RMSE: 2,611.2 MW | MAPE: 21.9%)**: Rapid cold fronts and storm transitions triggered large forecast swings, creating severe sudden deficits.
- **The Trading Implication**: Bidding 1:1 on raw day-ahead forecasts without a risk buffer exposes a desk to repeated cashout penalties. A data-backed thermal buffer is essential to protect trading margins.

---

## Core Features

### 1. Day-Ahead Decision View
- Select any delivery date in January 2026 and adjust the gate closure cutoff hour (defaulting to 11:00 UTC on D-1).
- Visualizes the published day-ahead forecast against actual metered generation.
- Enforces strict gate closure filtering—only forecasts published before the cutoff are used, completely avoiding look-ahead bias.

### 2. Quantitative Error Analytics
- **Error Distribution Histogram**: Displays the spread of forecast misses with empirical P10, P50, and P90 percentiles.
- **Diurnal Error Profile**: Breaks down average error across the 48 daily settlement periods (00:00 to 23:30) to pinpoint intraday ramp biases (e.g., morning pickup vs. evening peak).
- **Daily Trend Tracker**: Pinpoints high-volatility storm days throughout January to assess extreme weather performance.

### 3. Thermal Risk Buffer Calculator
- Interactive risk tolerance selector (P50, P80, P90, P95 confidence levels).
- Calculates the exact recommended backup thermal volume (in MW) to procure.
- Estimates potential Balancing Mechanism cashout penalty savings based on historical shortfall spreads.

---

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│                      DATA INGESTION                    │
│  Elexon BMRS API Streams:                              │
│  • FUELHH  -> Half-hourly metered actual wind output   │
│  • WINDFOR -> Batched wind forecast updates            │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    BACKEND (FastAPI)                   │
│  • Gate-closure filter (publish_time <= D-1 11:00 UTC) │
│  • Linear interpolation to 48 settlement periods       │
│  • High-speed in-memory store (<10ms response times)   │
│  • Statistical error engine (MAE, RMSE, MAPE, MBE)     │
└───────────────────────────┬────────────────────────────┘
                            │ REST API
┌───────────────────────────▼────────────────────────────┐
│                   FRONTEND (React 19)                  │
│  • Day-Ahead Forecast vs Actual View                   │
│  • Quantitative Analytics & Diurnal Profile            │
│  • Thermal Risk Buffer Sizing Tool                     │
│  • Bklit interactive time-series & bar charts          │
└────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
gridassign/
├── backend/
│   ├── api/
│   │   ├── routes_forecast.py       # Day-ahead schedule endpoint
│   │   └── routes_analytics.py      # Monthly summary & daily metrics
│   ├── data/
│   │   └── raw/                     # Cached Elexon BMRS streams (Jan 2026)
│   ├── models/
│   │   └── schemas.py               # Pydantic v2 schemas
│   ├── services/
│   │   ├── elexon_client.py         # Resilient Elexon API client
│   │   ├── data_pipeline.py         # Gate-closure matching & data caching
│   │   └── error_metrics.py         # Statistical calculations
│   ├── main.py                      # FastAPI app entry point & CORS
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # Python container configuration
│   └── verify_core.py               # Test & validation script
│
├── frontend/
│   ├── src/
│   │   ├── api/                     # Typed client & API definitions
│   │   ├── components/
│   │   │   ├── analytics/           # Error distributions & diurnal views
│   │   │   ├── charts/              # Bklit UI charting primitives
│   │   │   ├── decision/            # Thermal risk buffer calculator
│   │   │   ├── forecast/            # Day D-1 forecast comparison view
│   │   │   └── layout/              # Sidebar navigation & shell
│   │   ├── App.tsx                  # Main application container
│   │   └── index.css                # Styling & color tokens
│   ├── package.json                 # Dependencies (React 19, Vite, Tailwind)
│   ├── Dockerfile                   # Nginx production build
│   └── vercel.json                  # SPA routing configuration
│
└── docker-compose.yml               # Multi-container orchestration
```

---

## Getting Started

### Option 1: Docker (Fastest)

Run both backend and frontend containers with one command:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Option 2: Run Locally

#### 1. Backend Setup (Python 3.11+)

```bash
cd backend
python -m venv venv

# Activate venv:
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Frontend Setup (Node.js 18+)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Statistical Methodology

To measure forecast accuracy without distorting real-world trading conditions:

1. **Gate Closure Enforcement**: Only forecasts published strictly before the cutoff timestamp ($\text{PublishTime} \le \text{DeliveryDate}_{D-1} \text{ 11:00 UTC}$) are considered.
2. **Mean Absolute Error (MAE)**: Measures average absolute miss in MW, giving a clear baseline expectation.
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} \left| F_i - A_i \right|$$
3. **Root Mean Square Error (RMSE)**: Penalizes large, sudden forecast errors more heavily than small ones—critical during storm disruptions.
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)^2}$$
4. **Mean Absolute Percentage Error (MAPE)**: Normalized percentage error relative to actual delivered generation.
   $$\text{MAPE} = \frac{100\%}{N_{\text{active}}} \sum_{A_i > 0} \frac{\left| F_i - A_i \right|}{A_i}$$
5. **Directional Bias (Mean Bias Error)**: Identifies whether forecasts systematically overpredict ($>0$) or underpredict ($<0$).
   $$\text{MBE} = \frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)$$

---

## AI Usage Disclosure

As specified in the project brief, this platform was developed using **Google Antigravity AI** as an active pair-programming partner. 

AI was used iteratively to write, test, and refine code across the full stack:
- **Backend & Data Pipeline**: Co-authoring FastAPI endpoints, Pydantic schemas, and pandas processing pipelines to ingest Elexon BMRS streams (`FUELHH` and `WINDFOR`) while strictly enforcing gate closure.
- **Statistical Engine**: Writing and verifying the vectorized math for MAE, RMSE, MAPE, Mean Bias Error (MBE), and empirical quantiles in `services/error_metrics.py`.
- **Frontend & Visualizations**: Building React 19 / TypeScript components, managing reactive view states, and wiring live API data into Bklit UI charting primitives.
- **DevOps & Verification**: Authoring multi-stage Dockerfiles, Docker Compose setups, and verification scripts (`verify_core.py`).

All system architecture, market rules, verification testing, and UI decisions were driven and reviewed by the engineer.

---

## Attributions & Open Source Acknowledgments

- **Bklit UI Chart Primitives** ([bklit.com](https://bklit.com)): The charting components in `frontend/src/components/charts/` are sourced from Bklit UI (built with `@visx` and `motion`). They were imported as foundational visualization components and wired to our backend API endpoints.
- **Grid Data**: Sourced from official Elexon BMRS / National Grid ESO APIs (`FUELHH` and `WINDFOR`).

