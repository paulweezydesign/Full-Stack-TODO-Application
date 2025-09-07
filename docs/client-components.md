## Client components reference

### Overview
The client is a React 18 + Vite application styled with TailwindCSS. Components are located under `Client/src/`.

- `App.jsx` – App entry that decides which screen or demo to render
- `Home.jsx` – ToDo UI wired to the server API
- `Alert.jsx` – SweetAlert2 demo buttons
- `FlexBox.jsx` – Tailwind flexbox layout demo

Import components in `App.jsx` and render as needed.

### App
- **File**: `Client/src/App.jsx`
- **Props**: none
- **Usage**:
```jsx
import React from 'react'
import Home from './Home'
import Alert from './Alert'
import FlexBox from './FlexBox'

const App = () => {
  return (
    <div>
      {/* Swap the component below to view different screens */}
      <Home />
      {/* <Alert /> */}
      {/* <FlexBox /> */}
    </div>
  )
}

export default App
```

### Home (ToDo UI)
- **File**: `Client/src/Home.jsx`
- **Props**: none
- **Description**: A basic ToDo interface with tabs for All, Active, and Completed.
- **Behavior**:
  - Add a task: `POST /new-task` with `{ task }`
  - Read all tasks: `GET /read-tasks`
  - Edit a task: `POST /update-task` with `{ updateId, task }`
  - Delete a task: `POST /delete-task` with `{ id }`
  - Complete a task: `POST /complete-task` with `{ id }`
- **Usage**:
```jsx
import Home from './Home'

export default function App() {
  return <Home />
}
```

### Alert (SweetAlert2 examples)
- **File**: `Client/src/Alert.jsx`
- **Props**: none
- **Description**: Showcases common SweetAlert2 modals (error, success, confirm with 3 buttons, image modal).
- **Usage**:
```jsx
import Alert from './Alert'

export default function App() {
  return <Alert />
}
```
- **Customize**: You can tweak the `Swal.fire` options (title, text, icon, buttons) inside the component to match your use case. See SweetAlert2 docs for the full option set.

### FlexBox (Tailwind layout demo)
- **File**: `Client/src/FlexBox.jsx`
- **Props**: none
- **Description**: Demonstrates vertical flex layout and spacing using Tailwind utility classes.
- **Usage**:
```jsx
import FlexBox from './FlexBox'

export default function App() {
  return <FlexBox />
}
```

### Styling and build
- **Tailwind**: Configured via `tailwind.config.js` and `postcss.config.js`. Main styles in `Client/src/index.css`.
- **Run**: `npm run dev` from `Client/` to start the Vite dev server.