# Full-Stack Todo Application – Documentation

This document provides a comprehensive reference for all **public APIs**, **React components**, and other publicly-exposed functions that make up this project.  After reading this guide you should be able to:

1. Install & run both the server and client locally
2. Integrate programmatically with the REST API
3. Understand and extend the React front-end
4. See working code examples for common tasks

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Getting Started](#getting-started)
3. [Server API Reference](#server-api-reference)
   * [Create a task – `POST /new-task`](#post-new-task)
   * [Read all tasks – `GET /read-tasks`](#get-read-tasks)
   * [Update a task – `POST /update-task`](#post-update-task)
   * [Delete a task – `POST /delete-task`](#post-delete-task)
   * [Mark task as complete – `POST /complete-task`](#post-complete-task)
4. [Client Components](#client-components)
   * [`App`](#app)
   * [`Home`](#home)
   * [`Alert`](#alert)
   * [`FlexBox`](#flexbox)
5. [FAQ](#faq)
6. [License](#license)

---

## Project Structure

```text
/Client          # React front-end (Vite + TailwindCSS)
  ├─ src/
  │   ├─ App.jsx
  │   ├─ Home.jsx
  │   ├─ Alert.jsx
  │   └─ FlexBox.jsx
  └─ ...
/Server          # Express.js + MySQL REST API
  └─ index.js
```

---

## Getting Started

### Prerequisites

* **Node.js ≥ 20** (client & server)
* **MySQL ≥ 8** (server only)

### 1. Clone & install dependencies

```bash
# clone repo (replace with your URL)
$ git clone https://github.com/your-org/your-todo-app.git
$ cd your-todo-app

# install server deps
$ cd Server && npm i && cd ..

# install client deps
$ cd Client && npm i
```

### 2. Configure the database

```sql
CREATE DATABASE sys;         -- or any name, just update Server/index.js
USE sys;

CREATE TABLE todos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task VARCHAR(255)      NOT NULL,
  createdAt DATETIME     NOT NULL,
  status ENUM('active','completed') DEFAULT 'active'
);
```

### 3. Environment variables (optional)

`Server/index.js` currently contains hard-coded DB credentials.  For production replace them with env vars or a secure config.

### 4. Run the apps

```bash
# start MySQL locally

# start server (port 5000)
$ cd Server && node index.js

# in a separate terminal – start client (port 5173)
$ cd Client && npm run dev
```

---

## Server API Reference

Base URL (local): `http://localhost:5000`

All endpoints return **JSON** and accept/return UTF-8 strings.

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST   | `/new-task`       | Create a new todo |
| GET    | `/read-tasks`     | Fetch all todos |
| POST   | `/update-task`    | Update the *task* text |
| POST   | `/delete-task`    | Delete a todo |
| POST   | `/complete-task`  | Mark a todo as completed |

### Common Task Object

```json
{
  "id": 1,
  "task": "Buy milk",
  "createdAt": "2024-01-01T12:34:56.000Z",
  "status": "active"   // or "completed"
}
```

---

### `POST /new-task`
Create a new todo.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| task  | string | ✓ | The text of the todo |

Example request (cURL):

```bash
curl -X POST http://localhost:5000/new-task \
     -H "Content-Type: application/json" \
     -d '{"task":"Write docs"}'
```

Success response – **200 OK**

```json
[ /* updated list */ ]
```

---

### `GET /read-tasks`
Fetch **all** todos

```bash
curl http://localhost:5000/read-tasks
```

Response – **200 OK** – array of tasks.

---

### `POST /update-task`
Update the *task* text for a given id.

| Field     | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| updateId  | int    | ✓        | The `id` to update |
| task      | string | ✓        | New text |

Example:

```bash
curl -X POST http://localhost:5000/update-task \
     -H "Content-Type: application/json" \
     -d '{"updateId":1,"task":"Write **better** docs"}'
```

Returns updated list.

---

### `POST /delete-task`
Delete a todo completely.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id    | int  | ✓        | Todo id |

```bash
curl -X POST http://localhost:5000/delete-task \
     -H "Content-Type: application/json" \
     -d '{"id":1}'
```

---

### `POST /complete-task`
Mark a todo as completed.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id    | int  | ✓        | Todo id |

```bash
curl -X POST http://localhost:5000/complete-task \
     -H "Content-Type: application/json" \
     -d '{"id":1}'
```

---

## Client Components

Below is a high-level overview of the publicly-exposed React components.  Import paths are relative to `Client/src`.

### `<App />`

```
import App from "./App";
```

Top-level component mounted by Vite.  Currently renders `<FlexBox />` but can be changed to render `<Home />` or others.

```jsx
// Example – switch to the todo app
function Root() {
  return <Home />;
}
```

---

### `<Home />` – `/Home.jsx`

The primary *todo-list* UI.  Responsibilities:

* CRUD operations via Axios against the REST API
* Tabbed view – **All / Active / Completed**
* In-place editing & status updates
* Minimal TailwindCSS styling

```jsx
import Home from "./Home";

export default function Page() {
  return (
    <div className="h-screen w-screen">
      <Home />
    </div>
  );
}
```

**Props:** *none* (self-contained)

---

### `<Alert />` – `/Alert.jsx`

Wrapper around **SweetAlert2** with four helper functions:

1. `displayPopup` – error alert
2. `displaySuccessPopup` – success alert
3. `displayPopupWith3btns` – confirmation with *Save / Don't save / Cancel*
4. `deletePopup` – alert with custom image

Usage example:

```jsx
import Alert from "./Alert";

function Demo() {
  return (
    <div>
      <Alert />
    </div>
  );
}
```

---

### `<FlexBox />` – `/FlexBox.jsx`

Demonstrates basic Tailwind flexbox utilities.  Renders a full-screen grey backdrop with a vertical stack of coloured squares.

```jsx
import FlexBox from "./FlexBox";

export default () => <FlexBox />;
```

---

## FAQ

**Q : Why does the server crash when MySQL is not running?**  
A : The connection is established eagerly on server start-up.  Make sure MySQL is running locally or refactor to reconnect on demand.

**Q : How do I deploy this app?**  
A : Provision a MySQL instance, set environment variables for credentials, and host the server on any Node-capable platform (e.g. Render, Railway). Build the client with `npm run build` and serve the `dist` folder.

---

## License

MIT – feel free to use and modify.