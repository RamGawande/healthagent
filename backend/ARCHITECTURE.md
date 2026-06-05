# Medical Assistant Backend Architecture

This document provides an overview of the backend architecture for the Medical Assistant project. It focuses on the FastAPI server, persistence, authentication, RAG (Retrieval-Augmented Generation), vector store indexing, document ingestion, and how the major subsystems interact.

---

## 📦 High-level Structure

```
backend/
  ├─ app/
  │   ├─ api/               # FastAPI routers (auth, chat, sessions, admin, guest)
  │   ├─ core/              # Core business logic (security, RAG agent, dependencies)
  │   ├─ models/            # SQLAlchemy ORM models
  │   ├─ schemas/           # Pydantic request/response models
  │   ├─ services/          # Vector store + document processing logic
  │   ├─ utils/             # Helpers
  │   ├─ config.py          # Settings + env handling
  │   ├─ database.py        # SQLAlchemy engine + session
  │   └─ main.py            # FastAPI app initialization + router mounting
  ├─ chroma_db/            # Persistent ChromaDB data for embeddings + retriever
  ├─ uploads/              # Uploaded PDF files used for ingestion
  ├─ Dockerfile*           # Docker build targets for production/dev
  ├─ requirements.txt      # Python dependencies
  └─ run.py                # Entrypoint for local development (uvicorn)
```

---

## 🧠 Core Components

### 1) FastAPI Web Server (`app/main.py`)
- Creates the FastAPI application.
- Configures CORS for local frontend origins.
- Validates that required API keys are set and prints warnings if missing.
- Creates database tables on startup.
- Registers routers for:
  - Authentication (`/api/auth`)
  - Sessions (`/api/sessions`)
  - Chat (`/api/chat`)
  - Admin tools (`/api/admin`)
  - Guest chat (`/api/guest`)

---

## 🔐 Authentication & Authorization

### JWT Auth + Password Hashing (`app/core/security.py`)
- Passwords are hashed using `bcrypt` (via `passlib`).
- JWT access tokens are created with `python-jose`.
- Support for login via **username OR email**.
- Includes dependency helpers:
  - `get_current_user` (validates JWT)
  - `get_current_active_user` (checks `is_active` flag)
  - `get_current_admin_user` (checks `is_admin` flag)

### Auth Endpoints (`app/api/auth.py`)
- `POST /api/auth/signup` — register a new user
- `POST /api/auth/login` — login and receive Bearer token
- `GET /api/auth/me` — get current user profile

---

## 🗄️ Database (Persistence)

### SQLAlchemy + SQLite (default)
- Configured through `app/database.py`.
- Default connection string: `sqlite:///./medical_assistant.db`.
- Tables are created on app startup via `Base.metadata.create_all(bind=engine)`.

### Models (ORM)
- `User` (`app/models/user.py`)
- `Session` (`app/models/session.py`) — chat sessions owned by a user.
- `Message` (`app/models/message.py`) — chat messages with roles (`user`, `assistant`, `system`).
- `Document` (`app/models/document.py`) — uploaded PDF metadata + ingestion status.

---

## 🧠 Retrieval-Augmented Generation (RAG)

### Core Agent (`app/core/rag_agent.py`)
- Uses **LangGraph** (state graph orchestration library) + **LangChain** wrappers.
- Built around a tool-enabled LLM agent:
  - `medical_assistant_rag` (context retrieval + LLM answer)
  - `tavily_search` (web search tool for local doctor/hospital lookup)
  - `book_appointment` (simulated appointment booking tool)
- For streaming responses, the backend exposes endpoints that stream SSE token-by-token.
- Supports **multimodal** input: if an image is sent, it uses **Groq multimodal API** instead of the LangGraph pipeline.

### Vector Store (`app/services/vector_store.py`)
- Uses **Chroma** as the embedding store.
- Uses HuggingFace embeddings (`sentence-transformers/all-MiniLM-L6-v2`).
- Provides:
  - `add_documents()` to ingest docs.
  - `get_retriever(k=3)` for RAG retrieval.
  - `similarity_search()`.

---

## 📄 Document Upload + Ingestion

### Admin Upload Endpoint (`app/api/admin.py`)
- `POST /api/admin/upload` (Admin-only)
- Accepts PDF uploads (max size from `MAX_FILE_SIZE`).
- Stores the file in `uploads/` and creates a `Document` row.
- Uses `DocumentProcessor` to:
  1. Extract text from PDFs (pdfplumber with fallback to pypdf)
  2. Split text into chunks (LangChain `RecursiveCharacterTextSplitter`)
  3. Add chunks into Chroma vector store

---

## 💬 Chat Flow

### Authenticated Chat (`/api/chat`)
- Session-based (sessions stored in DB). Users create sessions via `/api/sessions`.
- Message flow:
  1. User sends a prompt (optionally with an image).
  2. Backend stores the user message in `messages` table.
  3. `RAGAgent` handles the prompt (text-only or multimodal) and streams responses.
  4. Assistant response is stored after streaming completes.
- Supports streaming via Server-Sent Events (`text/event-stream`).

### Guest Chat (`/api/guest/chat`)
- No authentication required.
- Uses a random `guest_<uuid>` thread ID.
- Streams response similarly via `RAGAgent`.

---

## 🧩 Admin Features

Admin endpoints include:
- Listing and managing users (`/api/admin/users`)
- Promoting/demoting users to/from admin
- Activating/deactivating users
- Viewing user sessions + messages (audit)
- Uploading & managing documents
- System statistics (`/api/admin/stats`)

---

## ⚙️ Configuration

### Environment Configuration (`backend/.env`)
Important variables (with defaults in `app/config.py`):
- `DATABASE_URL` (default: SQLite file)
- `SECRET_KEY` (used for JWT)
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `GROQ_API_KEY` (required for Groq multimodal + GroqChat)
- `TAVILY_API_KEY` (used for web search tool)
- `GOOGLE_API_KEY` (legacy / unused but still present)
- `UPLOAD_DIR` (default `uploads/`)
- `CHROMA_DB_DIR` (default `chroma_db/`)

---

## 📌 Running the Backend

### Local (Python)
```bash
python backend/run.py
```

### Docker (development / production)
- Uses `docker-compose.yml` or `docker-compose.dev.yml`.
- Build + run containers via `docker-compose up --build`.

---

## 🧭 Key Files to Review

- `backend/app/main.py` — FastAPI startup + router wiring
- `backend/app/core/rag_agent.py` — RAG + LLM orchestration
- `backend/app/services/vector_store.py` — embeddings + Chroma storage
- `backend/app/services/document_processor.py` — PDF extraction + chunking
- `backend/app/api/*` — REST endpoints
- `backend/app/core/security.py` — JWT auth

---

## 🧪 Notes / Gotchas

- Chroma persistence lives in `backend/chroma_db/`. Deleting this folder resets the vector store.
- The RAG pipeline relies on API keys being set in `.env` (otherwise the app warns on startup).
- Uploaded PDFs are stored in `uploads/` and are not automatically cleaned up.

---

## 🧩 RAG Core Functionality (How Retrieval + Generation Works)

### 1) Document Indexing (Ingestion)
- Admin uploads PDFs via `POST /api/admin/upload`.
- `DocumentProcessor` extracts text (pdfplumber → pypdf fallback) and splits it into chunks.
- Chunks are embedded and stored in Chroma via `VectorStoreManager.add_documents()`.

### 2) Retrieval (Vector Search)
- When a question is asked, `RAGAgent.medical_assistant_rag()` uses `VectorStoreManager.get_retriever()`.
- The retriever performs an embedding-based similarity search (k=3 by default).
- Retrieved documents are concatenated into a context string.

### 3) Generation (LLM Response)
- The context + user query are passed into a Groq LLM (`meta-llama/llama-4-scout-17b-16e-instruct`).
- If no relevant docs are found, the agent falls back to a direct LLM call (no retrieval).
- All responses include a mandatory medical disclaimer.

### 4) Streaming / Multimodal
- For text-only requests, the streaming path uses LangGraph + `StateGraph` to produce tokenized SSE output.
- For image-augmented requests, the backend sends a `data:image/...;base64,...` payload directly to Groq's multimodal API for inference.

### LangGraph + LangChain in this Project
- **LangGraph** orchestrates the agent as a directed state graph:
  - `StateGraph` defines the core flow (agent node → tools → agent node).
  - `ToolNode` wraps LangChain tools, enabling the model to call `medical_assistant_rag`, `tavily_search`, and `book_appointment` automatically.
  - `tools_condition` determines when to invoke tools vs. respond directly.
  - `MemorySaver` is used as a checkpointer to persist graph state (mutable conversation state, thread IDs).
- **LangChain** is used for:
  - message type modeling (`SystemMessage`, `HumanMessage`, `AIMessage`)
  - tool schema configuration via `@tool` and `pydantic` models
  - vector store integration (Chroma + HuggingFace embeddings)
- **LLM integration**:
  - `ChatGroq` is used as the base LLM for tool calls and fallback generation.
  - For streaming, LangGraph yields incremental `AIMessage` events which are converted into SSE tokens.
  - For multimodal, Groq’s native streaming API is used directly since LangGraph does not currently support image inputs.

---

If you want me to expand this into a diagram or add a prioritized list of next improvements (e.g., async DB operations, background worker for document ingestion, or stronger access control), just say the word.