import requests
import sys

BASE_URL = "http://localhost:7777"

def load_history(session_id: str):
    url = f"{BASE_URL}/sessions/{session_id}?type=agent"
    headers = {"Content-Type": "application/json"}

    r = requests.get(url, headers=headers)
    if not r.ok:
        print(f"Error: {r.status_code} {r.text}")
        return

    data = r.json()
    print(data)

    # Try common formats
    messages = data.get("chat_history")

    print(f"\n--- Chat history for session {session_id} ---\n")

    for m in messages:
        role = m.get("role")
        content = m.get("content") or m.get("message") or str(m)
        print(f"{role.upper()}: {content}\n")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(1)

    load_history(sys.argv[1])
