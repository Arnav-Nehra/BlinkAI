# BlinkAI

A Bun-powered Express backend for an AI chat application with authentication, conversations, and streaming responses via Server-Sent Events (SSE). Data is persisted with PostgreSQL using Prisma.

## Features

- Authentication with signup and signin
- JWT-based request auth via middleware
- AI chat endpoint with streaming responses (SSE)
- Conversations and messages persisted in Postgres via Prisma
- In-memory cache to warm message history per conversation
- Built with Bun (no Node/npm required)

## Tech Stack

- Bun (runtime, dependency manager, password hashing)
- Express 5, CORS
- Prisma ORM with PostgreSQL
- `ai` SDK with `@ai-sdk/google` for Google Generative AI
- Zod for validation

## Repository Layout

```
/backend
  index.ts                # Express app entry
  routes/
    auth.ts               # /auth routes (signup, signin)
    ai.ts                 # /ai routes (chat + conversations)
  openai.ts               # ChatCompletion using Google Generative AI + ai SDK
  authMiddleware.ts       # JWT auth middleware
  prisma/schema.prisma    # Prisma schema (PostgreSQL)
  generated/prisma/       # Prisma client output
  types.ts                # Shared types, zod schemas, model list
```

## Prerequisites

- Bun 1.2+ (`curl -fsSL https://bun.sh/install | bash`)
- PostgreSQL database and connection string

## Environment Variables

Set these in your shell or a `.env` for local development (referenced by Prisma and the AI SDK):

- `DATABASE_URL` — PostgreSQL connection string (used by Prisma)
- `API_KEY` — Google Generative AI API key (used by `@ai-sdk/google`)

Example:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/blinkai?schema=public"
export API_KEY="your-google-genai-api-key"
```

## Install, Generate, and Migrate

Run all commands from the `backend` directory.

```bash
cd backend
bun install

# Generate Prisma client (output to generated/prisma)
bunx prisma generate

# Apply migrations (create DB schema)
# For local dev, you can use migrate dev; for CI/prod use migrate deploy
bunx prisma migrate dev --name init
# or
bunx prisma migrate deploy
```

## Run the Server

```bash
cd backend
bun run index.ts
```

Server listens on port 3000 by default.

## API

Base URL: `http://localhost:3000`

All protected routes require a Bearer token returned by `/auth/signin`.

### Auth

- POST `/auth/signup`
  - Body (JSON):
    ```json
    { "username": "user@example.com", "password": "yourPassw0rd", "name": "Alice" }
    ```
  - Responses: 200 with created user JSON; 411 for invalid data; 400 if user exists

- GET `/auth/signin`
  - Body (JSON):
    ```json
    { "username": "user@example.com", "password": "yourPassw0rd" }
    ```
  - Response: 200 with JWT string

Note: `signin` currently expects a JSON body on a GET request (unconventional). If using `curl`, use `-X GET` with `--data` and `-H 'Content-Type: application/json'`.

### Conversations

- GET `/ai/conversation` — List conversations for the authenticated user
  - Headers: `Authorization: Bearer <token>`

- GET `/ai/conversation/:conversationId` — Get a specific conversation
  - Headers: `Authorization: Bearer <token>`

### Chat (SSE Streaming)

- POST `/ai/chat`
  - Headers:
    - `Authorization: Bearer <token>`
    - `Content-Type: application/json`
  - Body (JSON):
    ```json
    {
      "message": "Hello there!",
      "model": "gemini-2.5-flash",
      "conversationId": "<optional-uuid>"
    }
    ```
  - Response: `text/event-stream` with events like:
    ```
    data:{"content":"partial token..."}

    data:{"content":"next chunk..."}

    data:{"done":true}
    ```
  - Behavior:
    - If `conversationId` is omitted, a new conversation is created
    - Previous messages for the conversation are loaded from DB into an in-memory cache
    - User input and assistant output are saved to the database

## Data Model (Prisma)

- `User` — id, username (unique), password (hashed by Bun), name, createdAt
- `Conversation` — id, userId, createdAt, messages
- `Message` — id, conversationId, content, role, createdAt

## Development Notes

- CORS is enabled globally
- Requests/Responses are JSON except the streaming chat which is SSE
- JWT secret is currently hardcoded as `"secret"` in `authMiddleware.ts` and `routes/auth.ts`. For production, refactor to use an environment variable.
- Supported models are defined in `types.ts` (`gemini-2.5-flash` by default)

## Troubleshooting

- Prisma client not found / wrong output path
  - Ensure `bunx prisma generate` ran and `generated/prisma` exists
- Database connection errors
  - Verify `DATABASE_URL` and that Postgres is reachable
- No streaming output
  - Confirm `API_KEY` is set and valid for Google Generative AI
  - Check network proxies and that the client handles `text/event-stream`

## License

Proprietary — all rights reserved (update as applicable).


