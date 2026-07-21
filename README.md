# Task Management Control System

A premium, full-stack Task Management System built for technical assessment. It features a responsive glassmorphic dark theme dashboard, JWT-based security context, MySQL relational database backing, and full task lifecycle operations.

---

## Technical Stack Architecture

*   **Frontend:** React.js (built on Vite, powered by Lucide icons, responsive CSS variables layout, dynamic transitions)
*   **Backend:** Node.js, Express.js (modular controllers, ES modules, customized router maps)
*   **Database:** MySQL (`mysql2/promise` pool connector with self-initializing migration logic)
*   **Authorization:** JWT (JSON Web Tokens) with a header evaluation middleware

---

## Layout & Features

1.  **User Authentication & Authorization Check:**
    *   Secure `/api/auth/login` endpoint returns a signed JWT.
    *   No signup required. Database is automatically initialized with default admin credentials: `admin@test.com` / `123456`.
    *   Token interception on the client side injects authorization header tags (`Authorization: Bearer <JWT_TOKEN>`) dynamically.

2.  **Operations Dashboard:**
    *   Dynamic statistics computation panel measuring Total Tasks, Pending Tasks, In Progress Tasks, Completed Tasks, and Overdue Tasks.
    *   Overdue tasks are dynamically calculated for active items whose scheduled due dates are strictly prior to the current system date at midnight local time.

3.  **Complete Task Workspace CRUD:**
    *   **Create & Update:** Complete validations: Task title is required, due date cannot be set in the past (unless existing and unchanged), priority ('Low', 'Medium', 'High') and status ('Pending', 'In Progress', 'Completed') are restricted to enum limits.
    *   **Read:** Individual and list queries filtered securely relative to the authenticate user identity (`user_id`).
    *   **Delete:** Permanently drop items with confirmation overlays.
    *   **Inline Status Transitions:** Dropdown selections directly within cards allow switching statuses instantly.

4.  **Multi-layer Search, Filtering & Ordering:**
    *   *Search*: Real-time keyword indexing matching titles.
    *   *Filters*: Concurrent filtering constraints combining status and priority selections.
    *   *Sorting*: Sortable layouts supporting Newest Created, Oldest Created, and Due Date orderings.

---

## File Structure

```text
Koncepthive/
├── frontend/          # React application
│   ├── src/
│   │   ├── Assets/
│   │   ├── App.css    # Layout overrides
│   │   ├── App.jsx    # React components, state, Axios routing
│   │   ├── index.css  # Design system (glassmorphic theme, layout)
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js # Proxy mappings from /api to localhost:5000
│   └── package.json
├── backend/           # Node.js & Express application
│   ├── config/
│   │   └── db.js      # Relational driver pool and self-migration scripts
│   ├── middleware/
│   │   └── auth.js    # JWT authorization validator
│   ├── routes/
│   │   ├── auth.js    # Authentication API handler
│   │   └── tasks.js   # CRUD operations with security qualifiers
│   ├── .env           # Environment file
│   ├── package.json
│   └── server.js      # Server core & entry
├── database/          # Database definitions
│   └── schema.sql     # SQL structures
├── .env.example       # Template environment options
└── README.md          # Technical documentation & usage instructions
```

---

## Database Migration & Schema

The system initializes schema configurations automatically on startup (defined inside [database/schema.sql](file:///d:/My/Koncepthive/database/schema.sql)).

**Users Table Schema:**
*   `id` INT AUTO_INCREMENT PRIMARY KEY
*   `name` VARCHAR(255) NOT NULL
*   `email` VARCHAR(255) NOT NULL UNIQUE
*   `password` VARCHAR(255) NOT NULL (Bcrypt Hashed)
*   `created_at` TIMESTAMP
*   `updated_at` TIMESTAMP

**Tasks Table Schema:**
*   `id` INT AUTO_INCREMENT PRIMARY KEY
*   `user_id` INT NOT NULL (Foreign Key pointing to `users(id)` ON DELETE CASCADE)
*   `title` VARCHAR(255) NOT NULL
*   `description` TEXT NULL
*   `priority` ENUM('Low', 'Medium', 'High')
*   `status` ENUM('Pending', 'In Progress', 'Completed')
*   `due_date` DATE NOT NULL
*   `created_at` TIMESTAMP
*   `updated_at` TIMESTAMP

---

## Setup & Execution Guide

### Prerequisites
*   Node.js (v18 or higher recommended)
*   MySQL Server instance (running local port 3306 or target hosting)

### Phase 1: Environment Configuration
1. Copy `.env.example` parameters into a new file named `.env` located inside the `backend/` directory:
   ```bash
   cp .env.example backend/.env
   ```
2. Open `backend/.env` and update the parameters matching your local MySQL credentials:
   ```dotenv
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   # If MySQL runs on empty password, leave: DB_PASSWORD=
   ```

### Phase 2: Launching Backend Server
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start backend services:
   ```bash
   # Development hot-reload
   npm run dev
   
   # Or standard launch
   npm start
   ```


### Phase 3: Launching Frontend Desktop Panel
1. Open a new terminal tab at the root and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Boot the local development proxy server:
   ```bash
   npm run dev
   ```
4. Access the browser console page at:
   ```text
   http://localhost:5173
   ```
5. Enter admin credential parameters:
   *   **Username:** `admin@test.com`
   *   **Password:** `123456`

---

## API Documentation Guide

All endpoints expect JSON input types and return JSON structures.

### Authentication Endpoints

*   **`POST /api/auth/login`**
    *   *Purpose*: Validate credential inputs and retrieve JWT.
    *   *Body Requirements*:
        ```json
        { "email": "admin@test.com", "password": "123456" }
        ```
    *   *Response Sample*:
        ```json
        {
          "success": true,
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "user": { "id": 1, "name": "Administrator", "email": "admin@test.com" }
        }
        ```

### Task CRUD Endpoints (Requires Authorization Headers: `Bearer <token>`)

*   **`GET /api/tasks`**
    *   *Purpose*: Fetch task records owned by the authorized user.
    *   *Query Parameters*:
        *   `search` (string): Text filter indexing task titles.
        *   `status` (string: `Pending` | `In Progress` | `Completed`).
        *   `priority` (string: `Low` | `Medium` | `High`).
        *   `sortBy` (string: `newest` | `oldest` | `due_date` | `due_date_desc`).
    *   *Response Sample*:
        ```json
        {
          "success": true,
          "tasks": [
            {
              "id": 5,
              "user_id": 1,
              "title": "Database Optimization Tasks",
              "description": "Examine index allocations and drop unused schemas.",
              "priority": "High",
              "status": "In Progress",
              "due_date": "2026-07-25",
              "created_at": "2026-07-21T12:00:00.000Z",
              "updated_at": "2026-07-21T12:00:00.000Z"
            }
          ]
        }
        ```

*   **`GET /api/tasks/:id`**
    *   *Purpose*: Fetch a single task detail.
    *   *Response*: Details of task or `404 Not Found` if ownership mismatch occurs.

*   **`POST /api/tasks`**
    *   *Purpose*: Register a new task.
    *   *Body Requirements*:
        ```json
        {
          "title": "Upgrade Server CPU Profile",
          "description": "Coordinate migration with hardware team.",
          "priority": "Medium",
          "status": "Pending",
          "due_date": "2026-07-30"
        }
        ```

*   **`PUT /api/tasks/:id`**
    *   *Purpose*: Modify task fields or change inline status. Passes parameters like title, status, description, priority, etc.

*   **`DELETE /api/tasks/:id`**
    *   *Purpose*: Permanently delete a task.

---

## Architectural Assumptions

*   **Localhost database instance**: It is assumed that a standard MySQL service is running on `localhost:3306`. If configured with passwords, they are set using the backend `.env` variables.
*   **Multi-User Security segregation**: Tasks are strictly locked down according to the verified user identity obtained from JWT payload checks. Users cannot view, modify, or delete items created by other users.
*   **Timezone representation**: Dates are registered in simple `YYYY-MM-DD` strings inside queries to avoid timezone deviation errors caused by database conversions.
