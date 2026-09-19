# Chatty

A modern, full-stack real-time messaging application built with NestJS, React, PostgreSQL, and Socket.IO.

Engineered and optimized with the assistance of Google DeepMind Antigravity.

---

## Overview

Chatty is a high-performance communication platform designed for instant messaging, presence detection, and secure media sharing. The application utilizes a monorepo structure managed with pnpm workspaces, decoupling a modular NestJS API backend from a reactive Vite-powered React frontend.

---

## Key Features

### Real-Time Communication
- Full-duplex messaging powered by Socket.IO with WebSocket transport prioritization.
- Instant presence detection broadcasting online and offline status across active sessions.
- Clean connection lifecycle handling to prevent dangling socket memory leaks.

### Media Pipeline
- Client-side image pre-compression using Compressor.js prior to transmission.
- Multi-image upload support (up to 5 images per dispatch) with progress tracking.
- Cloudinary asset storage with automatic quality and format optimization.

### Security and Authentication
- Stateless JWT-based authentication with secure cookie storage and Bearer token fallback.
- Password hashing with bcrypt.
- Input validation and schema sanitization via Joi on the backend and Zod on the frontend.

### Architecture and Reliability
- PostgreSQL database integration using Drizzle ORM for type-safe schema definitions and migrations.
- Configured connection pooling with automatic idle timeouts.
- Node.js heap management (`--max-old-space-size=350`) for deployment stability in memory-constrained container environments (e.g., Render 512MB RAM tiers).
- HTTP response compression (Gzip) enabled for minimal network latency.
- Structured, low-overhead HTTP request logging using Pino.

---

## Tech Stack

### Backend
- Framework: NestJS (Express platform)
- Language: TypeScript
- Database: PostgreSQL
- ORM: Drizzle ORM / Drizzle Kit
- Real-Time: Socket.IO (@nestjs/platform-socket.io)
- Authentication: Passport JWT, bcrypt
- Media Storage: Cloudinary SDK
- Logging: Pino (nestjs-pino)
- Containerization: Docker, Docker Compose

### Frontend
- Framework: React 19
- Build Tool: Vite
- Language: TypeScript
- State Management: Zustand
- Styling: Tailwind CSS, DaisyUI
- Real-Time Client: Socket.IO Client
- Form Handling: React Hook Form, Zod
- Client Compression: Compressor.js
- Icons: Lucide React

---

## Project Structure

```
Chatty/
├── Backend/
│   ├── src/
│   │   ├── core/           # Database, config, logger, Cloudinary, error filters
│   │   ├── modules/        # Auth, User, and Message feature domains
│   │   ├── socket/         # Socket.IO gateway and presence handling
│   │   ├── app.module.ts   # Root application module
│   │   └── main.ts         # Application entrypoint
│   ├── drizzle/            # Database migrations
│   ├── Dockerfile          # Production and development multi-mode Dockerfile
│   └── docker-compose.yml  # Local stack orchestration (PostgreSQL, Adminer, API)
├── Frontend/
│   ├── src/
│   │   ├── components/     # UI components (Chat, Sidebar, Navbar, Inputs)
│   │   ├── pages/          # Application views (Home, Login, Signup, Profile, Settings)
│   │   ├── store/          # Zustand state stores (auth, chat, theme)
│   │   └── lib/            # Axios instance and utility helpers
│   ├── vercel.json         # SPA client-side routing rewrites
│   └── vite.config.ts      # Vite configuration
├── pnpm-workspace.yaml     # Monorepo workspace configuration
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (version 20 or later)
- pnpm (version 10 or later)
- Docker and Docker Compose (optional for containerized setup)

### Installation

Clone the repository and install dependencies from the workspace root:

```bash
git clone https://github.com/itzSerag/Chatty.git
cd Chatty
pnpm install
```

### Environment Configuration

#### Backend (`Backend/.env`)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/chatty
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=3d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:5173
```

#### Frontend (`Frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Running Locally

#### Option 1: Running with Docker Compose (Recommended for Full Stack)
```bash
cd Backend
docker-compose up -d
```
This initializes the PostgreSQL database, Adminer (available at port 8080), and the backend in watch mode on port 5000.

#### Option 2: Running Directly on Host

Start the backend:
```bash
cd Backend
pnpm run db:push
pnpm run start:dev
```

Start the frontend:
```bash
cd Frontend
pnpm run dev
```

---

## Deployment

- **Backend**: Containerized via `Backend/Dockerfile` and deployed on Render with managed WebSocket support and production memory capping.
- **Frontend**: Built with `pnpm build` and deployed on Vercel with single-page application rewrites (`Frontend/vercel.json`).
