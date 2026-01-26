# Chat UI with PocketBase

A React-based chat application with PocketBase authentication and session management.

## Features

- **User Authentication**: Login and registration with PocketBase
- **Session Management**: Create, load, and delete chat sessions
- **Message History**: Messages stored in JSON format with role (user/llm) and timestamps
- **Agent Integration**: Sessions linked to agent sessions via `agno_session_id`

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure PocketBase

Start PocketBase and create the `sessions` collection:

```bash
./pocketbase serve
```

Create a new collection called `sessions` with these fields:
- `name` (text)
- `user` (relation to users collection, cascade delete)
- `agno_session_id` (text)
- `messages` (json)

Set API rules for sessions:
- List/View: `@request.auth.id = user.id`
- Create: `@request.auth.id != ""`
- Update: `@request.auth.id = user.id`
- Delete: `@request.auth.id = user.id`

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## PocketBase Schema

See `POCKETBASE_SCHEMA.md` for detailed schema documentation.

## Project Structure

```
src/
  ├── components/
  │   ├── Login.jsx      # Login/Register form
  │   ├── Sidebar.jsx    # Session list sidebar
  │   ├── ChatWindow.jsx # Message display area
  │   └── ChatInput.jsx  # Message input field
  ├── App.jsx            # Main app with auth & routing
  ├── App.css            # App styles
  └── index.css          # Global styles
```
