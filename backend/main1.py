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
    
class ConversationCreate(BaseModel):
    project_id: str
    title: str | None = None


@app.post("/api/conversations")
def create_conversation(conversation: ConversationCreate):
    response = (
        supabase
        .table("conversations")
        .insert({
            "project_id": conversation.project_id,
            "title": conversation.title or "New Conversation"
        })
        .execute()
    )

    return {"conversation": response.data[0]}


class MessageCreate(BaseModel):
    conversation_id: str
    role: str
    content: str
    model: str | None = None


@app.post("/api/messages")
def create_message(message: MessageCreate):
    response = (
        supabase
        .table("messages")
        .insert({
            "conversation_id": message.conversation_id,
            "role": message.role,
            "content": message.content,
            "model": message.model
        })
        .execute()
    )

    return {"message": response.data[0]}

@app.get("/api/projects/{project_id}/conversations")
def get_conversations(project_id: str):
    response = (
        supabase
        .table("conversations")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )

    return {"conversations": response.data}


@app.get("/api/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str):
    response = (
        supabase
        .table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .execute()
    )

    return {"messages": response.data}


# --------------------------------
# MEMORY ENDPOINTS
# --------------------------------

class MemoryCreate(BaseModel):
    project_id: str
    memory_type: str
    title: str | None = None
    content: str


@app.get("/api/projects/{project_id}/memories")
def get_memories(project_id: str):
    response = (
        supabase
        .table("memories")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=False)
        .execute()
    )

    return {"memories": response.data}


@app.post("/api/memories")
def create_memory(memory: MemoryCreate):
    response = (
        supabase
        .table("memories")
        .insert({
            "project_id": memory.project_id,
            "memory_type": memory.memory_type,
            "title": memory.title,
            "content": memory.content
        })
        .execute()
    )

    return {"memory": response.data[0]}


class MemoryUpdate(BaseModel):
    memory_type: str | None = None
    title: str | None = None
    content: str | None = None


@app.put("/api/memories/{memory_id}")
def update_memory(memory_id: str, memory: MemoryUpdate):
    update_data = {
        key: value
        for key, value in memory.model_dump().items()
        if value is not None
    }

    response = (
        supabase
        .table("memories")
        .update(update_data)
        .eq("id", memory_id)
        .execute()
    )

    return {"memory": response.data[0]}


@app.delete("/api/memories/{memory_id}")
def delete_memory(memory_id: str):
    response = (
        supabase
        .table("memories")
        .delete()
        .eq("id", memory_id)
        .execute()
    )

    return {"deleted": True}