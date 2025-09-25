## Project documentation

### Overview
This project is a minimal full‑stack ToDo application consisting of:

- **Client (`Client/`)**: React 18 + Vite + TailwindCSS. Includes example UI components (`FlexBox`, `Alert`) and a CRUD ToDo UI (`Home`) that calls the server APIs.
- **Server (`Server/`)**: Express + MySQL. Exposes simple JSON endpoints for creating, reading, updating, deleting, and completing todos.

Use the links below to jump to the parts you need:

- [Quickstart](#quickstart)
- [Server API reference](./server-api.md)
- [Client components reference](./client-components.md)
- [Local setup and database schema](./setup.md)

### Project structure

- **Client/**: React app entry points and components
  - `src/App.jsx`: React root component
  - `src/Home.jsx`: ToDo screen that calls server endpoints
  - `src/Alert.jsx`: SweetAlert2 examples
  - `src/FlexBox.jsx`: Tailwind flexbox layout demo
- **Server/**: Express server and MySQL access
  - `index.js`: API endpoints and DB connection

### Quickstart

#### Prerequisites
- Node.js 18+
- A running MySQL instance (local is fine)

#### 1) Prepare the database
You can use the built-in `sys` database referenced in the current server config, or create your own database (recommended). See complete instructions in [Local setup and database schema](./setup.md). For a quick start on an empty local installation:

```sql
-- Quick-start: use the existing `sys` database referenced by the server
USE sys;

CREATE TABLE IF NOT EXISTS todos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL,
  status ENUM('active','completed') NOT NULL
);
```

If you prefer to use a different database (e.g., `todo_app`), create it and update the `database` field in `Server/index.js` accordingly. See [setup](./setup.md) for details.

#### 2) Start the server (port 5000)
```bash
cd Server
npm install
node index.js
```

#### 3) Start the client (default Vite port)
```bash
cd Client
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`). The client calls the server at `http://localhost:5000`.

### What’s included
- Fully working CRUD ToDo UI (`Home`) backed by the Express API
- Example alert modals using SweetAlert2 (`Alert`)
- Tailwind layout demo (`FlexBox`)

### Next steps
- Review the [Server API reference](./server-api.md) for request/response details with cURL examples
- Review the [Client components reference](./client-components.md) for usage examples and entry points
- Review [Local setup and database schema](./setup.md) to configure credentials and schema properly