# 10-Minute Video Demo Presentation Script

> **How to use this guide**:  
> Don't read this like a robot or a teleprompter! Speak naturally like you're talking directly to a colleague on Loom or Google Meet.  
> Each section gives you:
> 1. **Screen Action**: Exactly where to click and point.
> 2. **Quick Anchor Bullets**: Key ideas to glance at if you prefer speaking off-the-cuff.
> 3. **Conversational Script**: Natural, human wording you can adapt into your own voice.

---

## Part 1: Client Pitch — Wholesale Power Trading Desk (~4 to 5 Minutes)
**Who you are speaking to**: Head of Power Trading & Day-Ahead Procurement Desk at a UK Energy Utility  
**Your main goal**: Show how this app solves their daily 11:00 AM auction headache, saves real money, and makes trading decisions easy.

---

### [0:00 – 1:00] The Daily Problem Traders Face
* **Screen Action**: Start on your desktop or the clean app screen showing the dark-mode dashboard.
* **Quick Anchors**:
  - Every day by 11:00 AM (Day D-1), traders must buy electricity for tomorrow.
  - Wind is clean and cheap, but unpredictable.
  - If wind underdelivers, the utility pays brutal National Grid cashout penalty prices (£200–£400+/MWh).
  - This app gives traders clarity and tells them exactly how much thermal backup to buy.

* **Natural Script**:
  > *"Hi everyone. If you work on a UK energy trading desk, your most stressful hour of the day is 11:00 AM.*
  >
  > *That’s when the Day-Ahead auction gates close. You have to commit hundreds of thousands of pounds to buy enough electricity to keep the lights on for tomorrow.*
  >
  > *Naturally, you want to rely on wind power as much as possible—it’s green, it’s cost-effective. But wind is unpredictable. And here’s the kicker: if tomorrow comes and the wind drops unexpectedly, your position goes short. National Grid steps in, balances the grid, and sends you a punitive Balancing Mechanism bill that can easily spike past £200 or even £400 a megawatt-hour.*
  >
  > *Traders usually end up guessing how much backup thermal power to buy. We built this platform to replace that guesswork with hard math and live market data."*

---

### [1:00 – 2:30] Tab 1: The Day-Ahead Decision Workspace
* **Screen Action**: Click on the **Day-Ahead Decision** tab in the sidebar. Select **Jan 15, 2026**, hover over the time-series chart, then switch to **Jan 28, 2026** (the storm drop). Drag the customer demand slider below.
* **Quick Anchors**:
  - Zero look-ahead bias: only forecasts available before 11:00 AM D-1 are shown.
  - 48 settlement periods (half-hourly).
  - Blue line is the forecast; green shaded area is actual delivered wind.
  - Look at Jan 28: forecast promised 266 GWh, but only 138 GWh delivered.
  - The calculator at the bottom shows the exact thermal power to buy.

* **Natural Script**:
  > *"Let’s jump right into the trader’s daily cockpit.*
  >
  > *Notice up top: you can pick any delivery day in January 2026, and adjust the decision cutoff. We lock this to 11:00 AM on Day D-1 by default. That’s crucial because it guarantees **zero look-ahead bias**—you only ever see forecasts that were physically published before order books closed.*
  >
  > *Across these 48 settlement periods, the blue line is the forecast published before cutoff, and the green area is what actually hit the grid.*
  >
  > *Now, look at a normal day like January 15th—fairly close tracking. But watch what happens when I switch to **January 28th**.*
  >
  > *(Pause 1 second while chart updates)*
  >
  > *The national forecast predicted over 266,000 MWh of wind. But reality only delivered 138,000 MWh. That’s a massive 5.3 gigawatt error in a single day, with a 6.2 gigawatt deficit right during the evening peak.*
  >
  > *If you scrolled down, you'd see our buy-order calculator. You type in your customer load—say, 25,000 MW—and the portal immediately highlights your net shortfall and tells you exactly how many megawatts of dispatchable thermal power you need to order to stay safe."*

---

### [2:30 – 3:45] Tab 2: The Shocking Truth About Forecast Error
* **Screen Action**: Click **Quantitative Error Analytics** in the sidebar. Point your cursor to the 4 KPI cards, hover over the histogram bars, and then hover over the diurnal curve.
* **Quick Anchors**:
  - Ingested all 1,488 half-hours of Jan 2026.
  - MAE is 2,108 MW (~12% capacity).
  - The big revelation: Mean Bias Error is **+1,839 MW**.
  - The forecast isn’t randomly off—it systematically over-promises power 78% of the time!
  - Worst hours are 17:00–20:00 (evening peak when power is most expensive).

* **Natural Script**:
  > *"Next, we wanted to know: is January 28 just bad luck, or is there a systematic pattern?*
  >
  > *So we analyzed all 1,488 settlement periods across the entire month. Here’s what the data revealed:*
  >
  > *Our Mean Absolute Error is around 2,108 MW, which is about 12% of national wind capacity. But look at this fourth card: **Mean Bias Error is +1,839 MW**.*
  >
  > *That is a huge commercial finding. The forecast doesn't miss equally above and below zero. It consistently over-predicts wind generation by nearly 1.8 gigawatts. In fact, in almost 80% of half-hour periods, wind under-delivered compared to the morning forecast.*
  >
  > *Look at this histogram on the left: the entire curve is shifted heavily to the right. The median over-prediction is 1,666 MW, and in extreme cases, it tops 4,300 MW.*
  >
  > *And on the right, our diurnal chart shows that this error peaks between 5:00 PM and 8:00 PM—the exact window when UK households turn on appliances and electricity prices are at their highest."*

---

### [3:45 – 5:00] Tab 3: Sizing the Thermal Buffer & Saving £ Millions
* **Screen Action**: Click **Thermal Risk Buffer** in the sidebar. Click the **P90** button, then toggle **P95**. Point to the estimated savings card.
* **Quick Anchors**:
  - Solves the problem: how much buffer should traders actually procure?
  - P50 (neutral), P80 (cautious), P90 (institutional standard), P95 (storm hedge).
  - P90 prescribes a +4,334 MW thermal buffer.
  - Saves an estimated £1.08M per day in cashout penalty risk.

* **Natural Script**:
  > *"So, as a head of trading, how do you protect your firm without over-paying? That's what Tab 3 is built for.*
  >
  > *Instead of letting traders guess a safety margin, this tool calculates an empirical risk buffer based on the actual distribution of errors.*
  >
  > *You choose your risk appetite: P50 for neutral days, up to P90 or P95 when weather fronts are volatile. At the institutional P90 level, the model tells you to add a **4,334 MW thermal reserve**.*
  >
  > *So if your forecast says you have 14 GW of wind, you don't naively bid assuming you'll get 14 GW. You procure your thermal backup based on the risk-adjusted residual.*
  >
  > *At average winter cashout prices, avoiding a single P90 wind collapse saves over **£1 million in penalties in a single day**. That's how this platform pays for itself immediately."*

---

## Part 2: Technical Lead Review & Architecture (~4 to 5 Minutes)
**Who you are speaking to**: Lead Software Architect & Senior Engineering Reviewer  
**Your main goal**: Show clean architecture, zero look-ahead bias logic, high performance, and reliable containerization.

---

### [5:00 – 6:15] Architecture & Pragmatic Engineering
* **Screen Action**: Switch to VS Code or your terminal. Briefly show the clean directory tree in `README.md` or explorer (`backend/` and `frontend/`).
* **Quick Anchors**:
  - Decoupled modern stack: FastAPI (Python 3.11) + React 19 (TypeScript + Vite).
  - No unnecessary database bloat: used an ultra-fast in-memory analytical store (<5ms responses).
  - Clean separation of concerns: API routes, data pipeline, and error metrics are distinct modules.

* **Natural Script**:
  > *"Now let's switch gears to the engineering side.*
  >
  > *The technical requirement was to build a clean, production-grade, reproducible application. We chose a decoupled architecture:*
  > - *A **FastAPI backend** running Python 3.11 with Pandas and Pydantic v2.*
  > - *A **React 19 frontend** built with TypeScript, Vite, Tailwind CSS, and Bklit UI charting.*
  >
  > *One important engineering decision: we deliberately avoided adding a heavy relational database or an ORM. The January 2026 dataset is static market history with around 1,500 actuals and 19,000 forecast records. Ingesting this into an in-memory Pandas store on backend startup gives us sub-5-millisecond response times with zero database operational overhead."*

---

### [6:15 – 7:30] Data Pipeline & Look-Ahead Bias Enforcement
* **Screen Action**: Open `backend/services/data_pipeline.py`. Scroll to the `get_day_ahead_schedule` function and highlight the cutoff filtering and interpolation lines.
* **Quick Anchors**:
  - Elexon BMRS streams: `FUELHH` (metered wind actuals) and `WINDFOR` (forecasts).
  - Gate closure constraint: `publish_time <= delivery_date - 1 day at 11:00 UTC`.
  - Linear interpolation: `WINDFOR` is hourly; `FUELHH` is half-hourly (48 settlement periods).

* **Natural Script**:
  > *"Let's look at the most critical domain rule: **eliminating look-ahead bias**.*
  >
  > *In `backend/services/data_pipeline.py`, we ingest two streams from Elexon BMRS: `FUELHH` for actual metered wind generation, and `WINDFOR` for the rolling forecast stream.*
  >
  > *Here on lines 80 to 95 is where we enforce the gate closure. For any given delivery date, we calculate the exact cutoff timestamp—11:00 AM UTC on Day D-1. We strictly filter out any forecast records published after that timestamp.*
  >
  > *Also, Elexon's `WINDFOR` stream publishes at hourly resolution, but UK settlement periods are half-hourly (48 periods a day). Rather than duplicating rows or dropping points, we perform linear interpolation across the timeline. This gives us 48 smooth, continuous half-hourly forecast points that align 1-to-1 with actual generation."*

---

### [7:30 – 8:45] Frontend Craft & Bklit UI Chart Integration
* **Screen Action**: Show `frontend/src/components/charts/` and open `frontend/src/App.tsx` or `QuantitativeErrorView.tsx`.
* **Quick Anchors**:
  - Used Bklit UI library (Visx + Motion) for SVG charts with crisp performance.
  - Transparent attribution in README: credited Bklit UI for charting primitives.
  - Dark mode built with soft zinc tones (`#0c0c0e`), zero neon slop.
  - Fully responsive collapsible sidebar.

* **Natural Script**:
  > *"Moving to the frontend: we built this in React 19 with strict TypeScript.*
  >
  > *For the data visualizations, we integrated the open-source **Bklit UI library**, which is built on top of Visx and Motion. Standard charting libraries often cause re-render stutters or layout shifts when handling heavy datasets in React 19. Bklit gives us hardware-accelerated SVG rendering, silky-smooth animated tooltips, and crisp axis scaling.*
  >
  > *As noted in our README, we credit Bklit for these underlying chart primitives, which we configured and styled to fit our dark-mode utility aesthetic.*
  >
  > *For the UI, we used a soft charcoal zinc palette (`#0c0c0e` and `#18181b`) with zero neon glare, paired with an expandable and collapsible sidebar so traders have maximum screen space for their data."*

---

### [8:45 – 10:00] Docker Setup, Automated Verification & Wrap-up
* **Screen Action**: Show `docker-compose.yml`, run `python -m backend.verify_core` in the terminal to show green checkmarks, and point to the health endpoint.
* **Quick Anchors**:
  - Single-command startup: `docker compose up --build`.
  - Multi-stage frontend Dockerfile: Node 20 builder -> Alpine Nginx.
  - Verified with `verify_core.py`: 100% data match across 1,488 settlement periods.
  - Deployment-ready for Vercel (frontend) and Render/Heroku (backend).

* **Natural Script**:
  > *"Finally, let’s talk about reliability and how you run this.*
  >
  > *In the root directory, everything is containerized with a single `docker-compose.yml`. One command—`docker compose up --build`—spins up both services:*
  > - *The backend runs Python 3.11-slim with automatic health checks.*
  > - *The frontend uses a multi-stage Docker build that checks TypeScript types, compiles static assets with Vite, and serves them via Alpine Nginx with SPA routing.*
  >
  > *We also wrote an automated verification script: `python -m backend.verify_core`.*
  >
  > *(Run the command in terminal or point to output)*
  >
  > *It validates all 1,488 settlement periods, verifies that our MAE matches 2,108.5 MW, confirms zero look-ahead bias, and tests all API endpoints.*
  >
  > *To wrap up: this platform takes complex market data, eliminates forecasting blind spots, and gives trading desks a concrete, money-saving tool they can trust every single morning at 11 AM.*
  >
  > *Thank you for your time, and I look forward to your questions!"*

