## Local setup and database schema

### Prerequisites
- Node.js 18+
- MySQL 8+

### Server configuration
The server connects to MySQL using the configuration in `Server/index.js`:

```js
const db = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '...your password...',
  database : 'sys'
})
```

For a quick start, you can use the `sys` database and create the `todos` table there. For a more robust setup, create a dedicated database (e.g., `todo_app`) and change the `database` value accordingly.

### Create the schema

#### Option A: Quick start (use `sys`)
```sql
USE sys;

CREATE TABLE IF NOT EXISTS todos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL,
  status ENUM('active','completed') NOT NULL
);
```

#### Option B: Recommended (dedicated DB)
```sql
CREATE DATABASE IF NOT EXISTS todo_app;
USE todo_app;

CREATE TABLE IF NOT EXISTS todos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  task VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL,
  status ENUM('active','completed') NOT NULL
);
```

Then update `Server/index.js`:

```js
const db = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '...your password...',
  database : 'todo_app'
})
```

### Running locally
1) Start the API server (port 5000):
```bash
cd Server
npm install
node index.js
```

2) Start the client (Vite dev server):
```bash
cd Client
npm install
npm run dev
```

### Troubleshooting
- If API calls fail from the client, ensure the server is running on `http://localhost:5000` and that MySQL credentials are correct.
- If you changed the server port, update the URLs in `Client/src/Home.jsx` accordingly.
- Ensure your MySQL user has permissions to create tables and read/write rows in the selected database.