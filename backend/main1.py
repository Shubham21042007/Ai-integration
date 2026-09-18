import os
from pathlib import Path
from pydantic import BaseModel

from dotenv import dotenv_values
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client


# Get the .env file from the same folder as main1.py
BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

config = dotenv_values(ENV_FILE)

SUPABASE_URL = config.get("SUPABASE_URL")
SUPABASE_KEY = config.get("SUPABASE_PUBLISHABLE_KEY")


if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is missing from .env")

if not SUPABASE_KEY:
    raise ValueError("SUPABASE_PUBLISHABLE_KEY is missing from .env")


supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProjectCreate(BaseModel):
    name: str
    description: str | None = None

@app.get("/")
def home():
    return {
        "message": "Personal AI Workspace Backend is running!"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok"
    }


@app.get("/api/projects")
def get_projects():
    response = supabase.table("projects").select("*").execute()

    return {
        "projects": response.data
    }
    
@app.post("/api/projects")
def create_project(project: ProjectCreate):
    response = (
        supabase
        .table("projects")
        .insert({
            "name": project.name,
            "description": project.description
        })
        .execute()
    )

    return {
        "project": response.data[0]
    }