🛡️BASIC CRUD API

A production-ready, highly secure RESTful API built with Node.js, Express, and TypeScript. Designed with a Security-First mindset, it features robust data validation, protection against common web vulnerabilities, and optimized database interactions via PostgreSQL (Supabase).

🏗️ Architecture Overview

The application follows a modular, middleware-based architecture, ensuring high maintainability and a clean separation of concerns:

Routing Layer: Express Routers manage distinct namespaces for /auth and /api/tasks.

Validation Layer: Centralized Zod schemas validate every incoming request body, URL parameter, and environment variable.

Security Layer: Multi-step authentication gates, rate limiting, and HTTP header hardening via Helmet.

Data Layer: Optimized PostgreSQL queries, including a dynamic SQL builder for partial updates.

Safety Net: Global error-handling middleware that masks internal system details in production.

🔐 Security Deep-Dive
1. Authentication & Identity Protection

JWT (JSON Web Tokens): Stateless authentication using Bearer tokens.

Bcrypt Hashing: Industry-standard password encryption with a cost factor of 10.

Timing Attack Mitigation: Login flow uses a Dummy Hash strategy. Even if a user doesn’t exist, a fake password hash is compared to prevent response time leaks (prevents account enumeration).

Vague Auth Responses: Registration and login routes provide identical feedback (e.g., "Registration successful. If this is a new email, you can now log in.") to prevent attackers from identifying valid emails.

2. Infrastructure Hardening

Helmet.js: Automatically sets 15+ secure HTTP headers to mitigate XSS, clickjacking, and MIME-sniffing.

CORS: Restricted to authorized domains in production; open during development for flexibility.

Rate Limiting: Limits each IP to 100 requests per 15-minute window to protect against brute force and DoS attacks.

🧹 Data Integrity & Validation
Request Validation (Zod)

Gatekeeper: No request reaches the controller or database without passing a strict Zod schema.

Strict Typing: Prevents malformed data (e.g., numbers in string fields) from crashing the application.

Constraint Enforcement: Ensures rules like minimum password length (8 chars), valid email formats, and proper title/description lengths.

Dynamic SQL Updates

PUT /tasks/:id uses a custom dynamic query builder:

Efficiency: Updates only the fields included in the request.

Safety: Fully parameterized queries ($1, $2, ...) eliminate SQL injection risks.

🩺 Reliability & Monitoring
Health & Uptime

/health Endpoint: Tracks server uptime and validates the database connection.

Fast-Fail Environment: Server validates .env variables on startup. Missing critical variables (like DATABASE_URL) cause the process to exit immediately.

Graceful Shutdown (SIGTERM)

Handles termination signals to prevent data corruption and connection leaks:

Stop Ingest: Refuses new HTTP requests.

Drain: Allows active requests to complete.

Cleanup: Closes PostgreSQL connection pool and logger handles before exit.

| Method | Route        | Description                                      |
| ------ | ------------ | ------------------------------------------------ |
| POST   | /auth/signup | Registers a user (Protected against enumeration) |
| POST   | /auth/login  | Authenticates and returns a JWT                  |


| Method | Route          | Description                          |
| ------ | -------------- | ------------------------------------ |
| GET    | /api/tasks     | Returns user-owned tasks (paginated) |
| POST   | /api/tasks     | Creates a new task                   |
| PUT    | /api/tasks/:id | Dynamically updates task fields      |
| DELETE | /api/tasks/:id | Deletes a task (ownership enforced)  |


⚙️ Environment Configuration

Create a .env file in the root directory:
DATABASE_URL=postgres://user:password@host:port/db
JWT_SECRET=your_super_secret_key_here

📦 Getting Started
Install Dependencies
pnpm install

Run server
pnpm exec tsx index.ts 

