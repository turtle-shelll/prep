# Fastify Production Server (Port 6081)

A production-ready Fastify server built for high-throughput benchmarking and comparison with Express.

---

## 📁 Directory Structure

```text
fastify-server/
├── src/
│   ├── config/
│   │   └── index.js                 # Environment configuration (PORT=6081)
│   ├── controllers/
│   │   └── user.controller.js       # Fastify request handlers
│   ├── hooks/
│   │   └── logger.hook.js           # onResponse lifecycle hook with reply.elapsedTime
│   ├── schemas/
│   │   └── user.schema.js           # Ajv & fast-json-stringify JSON schemas
│   ├── routes/
│   │   ├── index.js                 # Root router plugin (/api/v1)
│   │   └── user.routes.js           # User resource routes plugin
│   ├── app.js                       # Fastify instance builder (decoupled for testing)
│   └── server.js                    # HTTP listener & graceful shutdown
├── .env                             # Local env (PORT=6081)
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore
├── package.json                     # NPM scripts & dependencies
└── payload.json                     # Sample POST test payload
```

---

## 🚀 Running the Server

```bash
cd fastify-server
npm install

# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

---

## ⚡ Load Testing Scripts (Port 6081)

```bash
# Autocannon GET benchmark (100 connections, 10s)
npm run test:load

# Autocannon POST benchmark with JSON payload
npm run test:load:post

# ApacheBench GET benchmark (5,000 requests, 100 concurrency)
npm run test:ab

# ApacheBench POST benchmark (2,000 requests, 50 concurrency)
npm run test:ab:post
```
