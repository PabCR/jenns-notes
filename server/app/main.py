from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from dotenv import load_dotenv
import os
from app.utils.auth import get_current_user

load_dotenv()

app = FastAPI(
    title="Nurse Resource Binder API",
    description="API for managing nurse educational resources and packets",
    version="0.1.0",
)

# CORS configuration - MUST be added before routes
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev port
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
]

# Add CORS middleware - this must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


@app.get("/")
async def root():
    return {"message": "Nurse Resource Binder API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


# Global exception handler to ensure CORS headers are always included
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Ensure CORS headers are included in HTTP exception responses."""
    origin = request.headers.get("origin")
    headers = dict(exc.headers) if exc.headers else {}
    
    # Add CORS headers
    if origin and origin in origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )
    return response


@app.exception_handler(StarletteHTTPException)
async def starlette_exception_handler(request: Request, exc: StarletteHTTPException):
    """Ensure CORS headers are included in Starlette HTTP exception responses."""
    origin = request.headers.get("origin")
    headers = {}
    
    # Add CORS headers
    if origin and origin in origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers,
    )
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Ensure CORS headers are included in validation error responses."""
    origin = request.headers.get("origin")
    headers = {}
    
    # Add CORS headers
    if origin and origin in origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers=headers,
    )


@app.options("/api/me")
async def options_me(request: Request):
    """Handle OPTIONS preflight request for /api/me."""
    origin = request.headers.get("origin", "http://localhost:5173")
    # Use the origin if it's in our allowed list, otherwise use the first allowed origin
    allowed_origin = origin if origin in origins else origins[0] if origins else "*"
    
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        },
    )


@app.get("/api/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Test endpoint to verify authentication."""
    return current_user

