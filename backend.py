from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import requests
import uvicorn
import json

BASE_URL = "http://host.docker.internal:7777"  # <-- change this

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CreateSessionRequest(BaseModel):
    session_name: str

@app.get("/sessions")
def list_sessions(type: str = "agent"):
    url = f"{BASE_URL}/sessions?type={type}"
    headers = {"Content-Type": "application/json"}

    r = requests.get(url, headers=headers)
    if not r.ok:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    return r.json()


@app.post("/sessions")
def create_session(req: CreateSessionRequest, type: str = "agent"):
    url = f"{BASE_URL}/sessions?type={type}"
    headers = {"Content-Type": "application/json"}
    data = {"session_name": req.session_name}

    r = requests.post(url, json=data, headers=headers)
    if not r.ok:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    return r.json()

@app.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    url = f"{BASE_URL}/sessions/{session_id}"
    headers = {"accept": "*/*"}

    r = requests.delete(url, headers=headers)
    if not r.ok:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    return {"ok": True}

class ChatRequest(BaseModel):
    session_id: str
    message: str

@app.post("/chat")
def chat(req: ChatRequest):
    agent_url = f"{BASE_URL}/agents/agno-agent/runs"

    files = {
        "message": (None, req.message),
        "stream": (None, "true"),
        "session_id": (None, req.session_id),
    }

    r = requests.post(agent_url, files=files, stream=True)
    if not r.ok:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    def stream():
        buffer = ""

        for raw in r.iter_content(chunk_size=1024, decode_unicode=True):
            if not raw:
                continue

            buffer += raw

            while True:
                data_pos = buffer.find("data:")
                if data_pos == -1:
                    break

                json_start = buffer.find("{", data_pos)
                if json_start == -1:
                    break

                brace_count = 0
                in_string = False
                escape = False

                for i in range(json_start, len(buffer)):
                    ch = buffer[i]

                    if escape:
                        escape = False
                        continue

                    if ch == "\\":
                        escape = True
                        continue

                    if ch == '"':
                        in_string = not in_string

                    if not in_string:
                        if ch == "{":
                            brace_count += 1
                        elif ch == "}":
                            brace_count -= 1
                            if brace_count == 0:
                                json_end = i + 1
                                break
                else:
                    break

                json_text = buffer[json_start:json_end]
                buffer = buffer[json_end:]

                try:
                    data = json.loads(json_text)
                except json.JSONDecodeError:
                    continue

                if data.get("event") == "RunContent":
                    chunk = data.get("content")
                    if chunk:
                        yield chunk

    return StreamingResponse(stream(), media_type="text/plain")

@app.get("/sessions/{session_id}")
def load_history(session_id: str, type: str = "agent"):
    url = f"{BASE_URL}/sessions/{session_id}?type={type}"
    headers = {"Content-Type": "application/json"}

    r = requests.get(url, headers=headers)
    if not r.ok:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    data = r.json()
    return data
    

if __name__ == "__main__":
    uvicorn.run("backend:app", host="0.0.0.0", port=4896, reload=True)