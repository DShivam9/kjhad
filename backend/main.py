"""
UK Wind Power Day-Ahead Decision & Forecast Evaluation API

FastAPI backend service serving day-ahead schedules and quantitative error analytics.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.services.data_pipeline import market_store
from backend.api.routes_forecast import router as forecast_router
from backend.api.routes_analytics import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event to preload January 2026 Elexon market data into memory.
    Ensures all subsequent client requests are served in < 10ms.
    """
    print("Pre-loading January 2026 Elexon market data into memory...")
    market_store.initialize()
    print("Market data ready. FastAPI server accepting requests.")
    yield


app = FastAPI(
    title="UK Wind Power Day-Ahead Decision Platform",
    description="API for evaluating UK wind power day-ahead forecasts against actual generation (January 2026)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for local frontend and production deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount feature routers
app.include_router(forecast_router)
app.include_router(analytics_router)


@app.get("/api/health", tags=["Health"])
def health_check():
    """
    Healthcheck endpoint reporting data status and cache health.
    """
    return {
        "status": "healthy",
        "market_data_initialized": market_store._is_initialized,
        "actuals_count": len(market_store.actuals_df),
        "forecasts_count": len(market_store.forecasts_df),
        "period": "January 2026",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
