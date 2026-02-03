import requests
import json 

BASE_URL = "http://localhost:7777"

def create_session():
    name = input("Enter session name: ")
    url = f"{BASE_URL}/sessions?type=team"
    headers = {"Content-Type": "application/json"}
    data = {"session_name": name}
    
    response = requests.post(url, json=data, headers=headers)
    if response.ok:
        session_data = response.json()
        print(f"Created session: {session_data.get('session_name')} (ID: {session_data.get('session_id')})")
    else:
        print(f"Error: {response.status_code} {response.text}")

def list_sessions():
    url = f"{BASE_URL}/sessions?type=team"
    headers = {"Content-Type": "application/json"}
    
    response = requests.get(url, headers=headers)
    if response.ok:
        sessions = response.json().get("data", [])
        if not sessions:
            print("No sessions found.")
            return []
        for i, session in enumerate(sessions, start=1):
            print(f"{i}. {session.get('session_name')} (ID: {session.get('session_id')})")
        return sessions
    else:
        print(f"Error: {response.status_code} {response.text}")
        return []

def choose_session():
    sessions = list_sessions()
    if not sessions:
        return None
    print("0. Go back to main menu")
    try:
        index = int(input("Select a session by number: "))
        if index == 0:
            return None
        index -= 1
        if 0 <= index < len(sessions):
            return sessions[index]
        else:
            print("Invalid selection.")
            return None
    except ValueError:
        print("Please enter a valid number.")
        return None

def delete_session():
    session = choose_session()
    if not session:
        return
    session_id = session.get("session_id")
    url = f"{BASE_URL}/sessions/{session_id}"
    headers = {"accept": "*/*"}
    
    response = requests.delete(url, headers=headers)
    if response.ok:
        print(f"Deleted session: {session.get('session_name')}")
    else:
        print(f"Error: {response.status_code} {response.text}")

def rename_session():
    session = choose_session()
    if not session:
        return
    new_name = input("Enter new session name: ")
    session_id = session.get("session_id")
    url = f"{BASE_URL}/sessions/{session_id}"
    headers = {"Content-Type": "application/json"}
    data = {"session_name": new_name}
    
    response = requests.patch(url, json=data, headers=headers)
    if response.ok:
        print(f"Session renamed to: {new_name}")
    else:
        print(f"Error: {response.status_code} {response.text}")

def chat():
    session = choose_session()
    if not session:
        return
    session_id = session.get("session_id")
    agent_url = f"{BASE_URL}/teams/service-agent-team/runs"

    print("Start chatting! Type 'exit' or 'quit' to leave.")
    while True:
        try:
            message = input("You: ")
            if message.lower() in {"exit", "quit"}:
                break

            files = {
                "message": (None, message),
                "stream": (None, "false"),
                "session_id": (None, session_id)
            }

            response = requests.post(agent_url, files=files)
            response.raise_for_status()
            data = response.json()
            content = data.get("content") or data.get("response") or data
            print(f"Agent: {content}")

        except KeyboardInterrupt:
            print("\nExiting chat...")
            break
        except Exception as e:
            print(f"Error: {e}")

def chat_stream():
    session = choose_session()
    if not session:
        return

    session_id = session.get("session_id")
    agent_url = f"{BASE_URL}/teams/service-agent-team/runs"

    print("Start chatting (streaming)! Type 'exit' or 'quit' to leave.")

    while True:
        try:
            message = input("\nYou: ")
            if message.lower() in {"exit", "quit"}:
                break

            files = {
                "message": (None, message),
                "stream": (None, "true"),
                "session_id": (None, session_id)
            }

            with requests.post(agent_url, files=files, stream=True) as response:
                response.raise_for_status()

                print("Agent: ", end="", flush=True)

                buffer = ""

                for raw in response.iter_lines(decode_unicode=True):
                    if not raw:
                        continue

                    buffer += raw.strip()

                    while True:
                        # Look for "data: {"
                        data_pos = buffer.find("data:")
                        if data_pos == -1:
                            break

                        # Find JSON start
                        json_start = buffer.find("{", data_pos)
                        if json_start == -1:
                            break

                        # Parse JSON by counting braces
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
                            break  # incomplete JSON

                        json_text = buffer[json_start:json_end]
                        buffer = buffer[json_end:]  # remove parsed JSON from buffer

                        try:
                            data = json.loads(json_text)
                        except json.JSONDecodeError:
                            continue

                        if data.get("event") == "TeamRunContent":
                            chunk = data.get("content")
                            if chunk:
                                print(chunk, end="", flush=True)

                print()  # newline after stream finishes

        except KeyboardInterrupt:
            print("\nExiting chat...")
            break
        except Exception as e:
            print(f"\nError: {e}")

def main():
    while True:
        print("\nOptions:")
        print("1. Create session")
        print("2. Delete session")
        print("3. Chat")
        print("4. List sessions")
        print("5. Rename session")
        print("6. Exit")
        choice = input("Select an option (1-6): ")

        if choice == "1":
            create_session()
        elif choice == "2":
            delete_session()
        elif choice == "3":
            chat_stream()
        elif choice == "4":
            list_sessions()
        elif choice == "5":
            rename_session()
        elif choice == "6":
            print("Goodbye!")
            break
        else:
            print("Invalid option. Try again.")

if __name__ == "__main__":
    main()
