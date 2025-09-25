## ToDo App (React + Express + MySQL)

Minimal full‑stack ToDo application.

### Quickstart
1) Prepare MySQL and create the `todos` table (see `docs/setup.md` for details). Quick start:
```sql
USE sys;
CREATE TABLE IF NOT EXISTS todos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL,
  status ENUM('active','completed') NOT NULL
);
```

2) Start the API server:
```bash
cd Server
npm install
node index.js
```

3) Start the client:
```bash
cd Client
npm install
npm run dev
```

Open the URL shown by Vite (typically `http://localhost:5173`). The client calls the server at `http://localhost:5000`.

### Documentation
- [Docs index](./docs/README.md)
- [Server API reference](./docs/server-api.md)
- [Client components reference](./docs/client-components.md)
- [Local setup and database schema](./docs/setup.md)

### Project structure
- `Client/`: React 18 + Vite + TailwindCSS
- `Server/`: Express + MySQL (CORS enabled)