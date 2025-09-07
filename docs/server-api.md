## Server API reference

Base URL: `http://localhost:5000`

### Overview
The server exposes unauthenticated JSON endpoints for ToDo management. All endpoints return the full list of todos after a mutation, or the current list on read.

### Data model
The `todos` table is expected to have the following fields:

- **id**: integer, auto-increment, primary key
- **task**: string, required
- **createdAt**: datetime, required
- **status**: enum, one of `active` or `completed`

Example row:
```json
{
  "id": 1,
  "task": "Buy milk",
  "createdAt": "2025-01-01T10:15:00.000Z",
  "status": "active"
}
```

### Endpoints

#### POST /new-task
Creates a new todo and returns the updated list.

- **Request body**
```json
{
  "task": "Buy milk"
}
```

- **Responses**
  - 200 OK: JSON array of todos

- **cURL**
```bash
curl -X POST \
  http://localhost:5000/new-task \
  -H 'Content-Type: application/json' \
  -d '{"task":"Buy milk"}'
```

#### GET /read-tasks
Returns the full list of todos.

- **Responses**
  - 200 OK: JSON array of todos

- **cURL**
```bash
curl http://localhost:5000/read-tasks
```

#### POST /update-task
Updates the `task` text for the given todo, then returns the updated list.

- **Request body**
```json
{
  "updateId": 1,
  "task": "Buy milk and eggs"
}
```

- **Responses**
  - 200 OK: JSON array of todos

- **cURL**
```bash
curl -X POST \
  http://localhost:5000/update-task \
  -H 'Content-Type: application/json' \
  -d '{"updateId":1,"task":"Buy milk and eggs"}'
```

#### POST /delete-task
Deletes the todo by `id`, then returns the updated list.

- **Request body**
```json
{
  "id": 1
}
```

- **Responses**
  - 200 OK: JSON array of todos

- **cURL**
```bash
curl -X POST \
  http://localhost:5000/delete-task \
  -H 'Content-Type: application/json' \
  -d '{"id":1}'
```

#### POST /complete-task
Marks the todo as `completed`, then returns the updated list.

- **Request body**
```json
{
  "id": 1
}
```

- **Responses**
  - 200 OK: JSON array of todos

- **cURL**
```bash
curl -X POST \
  http://localhost:5000/complete-task \
  -H 'Content-Type: application/json' \
  -d '{"id":1}'
```

### Notes and limitations
- There is currently no standardized error payload; errors are logged server-side.
- No authentication or authorization is implemented.
- CORS is enabled to allow the Vite dev server to call these endpoints from the browser.