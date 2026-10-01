# Scaled Node.js Server (Production Architecture)

A standard, production-ready Express.js server architecture following MVC / layered separation of concerns.

---

## 📁 Directory Structure

```text
scaled-nodeServer/
├── src/
│   ├── config/
│   │   └── index.js                 # Centralized environment configuration
│   ├── controllers/
│   │   └── user.controller.js       # Request handlers & business logic
│   ├── middlewares/
│   │   ├── logger.middleware.js     # Request duration & access logging
│   │   ├── validate.middleware.js   # Payload validation middleware
│   │   └── error.middleware.js      # 404 & centralized error handlers
│   ├── routes/
│   │   ├── index.js                 # Central router (API versioning)
│   │   └── user.routes.js           # User resource routes
│   ├── app.js                       # Express app configuration & middleware pipeline
│   └── server.js                    # HTTP server entrypoint & graceful shutdown
├── .env                             # Environment variables (git-ignored)
├── .env.example                     # Example environment variables template
├── .gitignore                       # Git ignore rules
├── package.json                     # NPM dependencies & scripts
└── README.md                        # Documentation
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` if not already present:
```bash
cp .env.example .env
```

### 3. Run the Server
```bash
# Production mode
npm start

# Development mode (with file-watch auto-reload)
npm run dev
```

---

## 📡 API Endpoints

Base URL: `http://localhost:6080/api/v1`

| Method | Endpoint | Description | Middleware Used |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status & uptime | Logger (skipped in prod if 200) |
| `GET` | `/api/v1/users` | List all users | Logger |
| `GET` | `/api/v1/users/:id` | Get user by ID | Logger |
| `POST` | `/api/v1/users` | Create a new user | Logger, `validateCreateUser` |

---

## 🛡️ Middlewares Included

1. **`requestLogger`** ([`src/middlewares/logger.middleware.js`](./src/middlewares/logger.middleware.js)):
   - **Production Mode (`NODE_ENV=production`)**: Outputs structured JSON lines directly to stdout (compatible with Datadog, CloudWatch, ELK), and skips logging high-frequency `/health` requests to eliminate event-loop latency.
   - **Development Mode**: Outputs human-readable colored request duration logs.
2. **`validateCreateUser`** ([`src/middlewares/validate.middleware.js`](./src/middlewares/validate.middleware.js)):
   - Validates that `name` and `email` are supplied before reaching the controller.
3. **`notFoundHandler` & `errorHandler`** ([`src/middlewares/error.middleware.js`](./src/middlewares/error.middleware.js)):
   - Centralized 404 handling and global unhandled error formatting.

---

## ⚡ Load Testing Scripts

Convenient load testing scripts configured for port `6080`:

```bash
# Autocannon GET benchmark (100 concurrent connections, 10s)
npm run test:load

# Autocannon POST benchmark with JSON payload
npm run test:load:post

# ApacheBench GET benchmark (5,000 requests, 100 concurrency)
npm run test:ab

# ApacheBench POST benchmark (2,000 requests, 50 concurrency)
npm run test:ab:post
```

---

## 🧪 Testing with cURL

```bash
# 1. Health check
curl http://localhost:6080/api/v1/health

# 2. Get all users
curl http://localhost:6080/api/v1/users

# 3. Get single user
curl http://localhost:6080/api/v1/users/1

# 4. Create user (Validation failure test - missing email)
curl -X POST http://localhost:6080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Hardik"}'

# 5. Create user (Success)
curl -X POST http://localhost:6080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Hardik Mistry", "email": "hardik@example.com"}'
```
