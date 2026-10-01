# Express vs Fastify Production Comparison & Benchmarking

This repository contains two production-architected HTTP servers implementing the exact same business logic and endpoints to allow side-by-side performance benchmarking:

1. **[`express-server/`](./express-server/)** — Running on port **`6080`**
2. **[`fastify-server/`](./fastify-server/)** — Running on port **`6081`**

---

## 📁 Repository Structure

```text
scaled-nodeServer/
├── express-server/                  # Express implementation (Port 6080)
│   ├── src/
│   │   ├── config/                  # Environment config
│   │   ├── controllers/             # Controller logic
│   │   ├── middlewares/             # Logger, validator, error middlewares
│   │   ├── routes/                  # Express routes
│   │   ├── app.js                   # Express app setup
│   │   └── server.js                # Server entrypoint & shutdown
│   ├── package.json
│   ├── payload.json
│   └── README.md
│
├── fastify-server/                  # Fastify implementation (Port 6081)
│   ├── src/
│   │   ├── config/                  # Environment config
│   │   ├── controllers/             # Controller logic
│   │   ├── hooks/                   # Fastify lifecycle hooks (logger)
│   │   ├── schemas/                 # JSON Schemas (Ajv + fast-json-stringify)
│   │   ├── routes/                  # Fastify route plugins
│   │   ├── app.js                   # Fastify app builder
│   │   └── server.js                # Server entrypoint & shutdown
│   ├── package.json
│   ├── payload.json
│   └── README.md
│
└── README.md                        # Master benchmarking guide
```

---

## 📡 Identical Endpoints Across Both Frameworks

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root framework & welcome metadata |
| `GET` | `/api/v1/health` | Health status and uptime |
| `GET` | `/api/v1/users` | List all users |
| `GET` | `/api/v1/users/:id` | Get single user by ID |
| `POST` | `/api/v1/users` | Create user (requires `{ "name", "email" }`) |

---

## 🚀 How to Run Both Servers

Open two terminal windows:

### Terminal 1: Express Server (Port 6080)
```bash
cd node.js/scaled-nodeServer/express-server
npm install
NODE_ENV=production npm start
```

### Terminal 2: Fastify Server (Port 6081)
```bash
cd node.js/scaled-nodeServer/fastify-server
npm install
NODE_ENV=production npm start
```

---

## ⚡ Side-by-Side Load Testing (Autocannon)

Run these tests in a third terminal to compare throughput (Req/Sec) and tail latency (p99):

### Test 1: GET `/api/v1/users` (100 connections, 10s)

```bash
# Express (Port 6080)
npx -y autocannon -c 100 -d 10 http://localhost:6080/api/v1/users

# Fastify (Port 6081)
npx -y autocannon -c 100 -d 10 http://localhost:6081/api/v1/users
```

### Test 2: POST `/api/v1/users` (50 connections, 10s with JSON body)

```bash
# Express (Port 6080)
cd express-server && npm run test:load:post

# Fastify (Port 6081)
cd fastify-server && npm run test:load:post
```

---

## 🔍 Key Architectural Differences

| Feature | Express 5 | Fastify 5 |
| :--- | :--- | :--- |
| **Default Port** | `6080` | `6081` |
| **JSON Serialization** | Standard `JSON.stringify()` | Pre-compiled `fast-json-stringify` (2-3x faster) |
| **Input Validation** | Manual middleware (`validateCreateUser`) | Built-in `Ajv` JSON Schema validator |
| **Routing Algorithm** | Linear Regex search | Radix-tree router (`find-my-way`) |
| **Extensibility Model**| Middlewares (`app.use`) | Encapsulated Plugins (`fastify.register`) |
| **Lifecycle Hooks** | `(req, res, next)` pipeline | `onRequest`, `preHandler`, `onResponse`, etc. |
| **Built-in Logging** | Needs external logger | Built-in Pino integration |
