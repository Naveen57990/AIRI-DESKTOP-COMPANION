# airi_desktop/airi_server.py
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

import config

app = FastAPI(title="Airi Companion Backend Hub", version="2.0.0")

# Enable CORS so the React browser application can securely communicate with localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connected websockets (clients like the desktop widget overlay and the React browser window)
active_connections: List[WebSocket] = []


class StudyTelemetry(BaseModel):
    face_present: bool
    phone: bool
    yawning: bool
    eyes_closed: bool
    looking_away: bool
    other_person: bool
    study_time: int
    distraction_duration: int


class AiriDecision(BaseModel):
    alert: bool
    message: str
    ignore: bool


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Airi Offline Coordination Hub",
        "description": "Bridges local MediaPipe/YOLO tracking state with your React frontend."
    }


@app.post("/api/telemetry")
async def receive_telemetry(telemetry: StudyTelemetry):
    """Receive study status update and broadcast to all connected WebSocket clients."""
    payload = {
        "type": "telemetry",
        "data": telemetry.dict()
    }
    await broadcast(json.dumps(payload))
    return {"status": "broadcasted", "recipients": len(active_connections)}


@app.post("/api/decision")
async def receive_decision(decision: AiriDecision):
    """Broadcast Airi speech overlay action requests."""
    payload = {
        "type": "decision",
        "data": decision.dict()
    }
    await broadcast(json.dumps(payload))
    return {"status": "broadcasted"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print(f"[WS] New node connected! Active connections: {len(active_connections)}")
    
    try:
        while True:
            # Keep connection alive, listen for any inbound control signals
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Re-broadcast any incoming client payloads directly to all nodes
                await broadcast(json.dumps(message))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        print(f"[WS] Client disconnected. Active connections: {len(active_connections)}")


async def broadcast(message: str):
    """Sends a websocket payload to all active client listeners (React + overlay)."""
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except Exception:
            # Stale connection cleanup
            active_connections.remove(connection)


if __name__ == "__main__":
    import uvicorn
    # Start on Port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
