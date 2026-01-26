# PocketBase Schema

This application requires the following PocketBase collections:

## users collection (built-in)
- email (email)
- password (password)
- avatar (file)

## sessions collection
Create a new collection called `sessions` with the following fields:

| Field Name | Type | Settings |
|------------|------|----------|
| name | text | Required: No |
| user | relation | Collection: users, Required: Yes, Cascade delete |
| agno_session_id | text | Required: Yes |
| messages | json | Required: No, default: [] |

### JSON Structure for messages field
The messages field stores an array of message objects:

```json
[
  {
    "role": "user",
    "content": "Hello, how can you help me?",
    "timestamp": "2024-01-23T10:30:00.000Z"
  },
  {
    "role": "llm",
    "content": "Hello! I'm here to help. What would you like to know?",
    "timestamp": "2024-01-23T10:30:05.000Z"
  }
]
```

### Role values
- `user` - Messages sent by the user
- `llm` - Responses from the language model

### API Rules

**users collection:**
- List/View: `@request.auth.id != ""` (authenticated users)
- Create/Update: `@request.auth.id = user.id` (own profile only)
- Delete: `@request.auth.id = user.id` (own profile only)

**sessions collection:**
- List/View: `@request.auth.id = user.id` (own sessions only)
- Create: `@request.auth.id != ""` (authenticated users)
- Update: `@request.auth.id = user.id` (own sessions only)
- Delete: `@request.auth.id = user.id` (own sessions only)
