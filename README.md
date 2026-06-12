# DocFlow — Asynchronous Document Processing Workflow System

DocFlow is a production-style full-stack application designed to handle asynchronous document ingestion and processing. Users can upload multiple documents, trigger back-end processing pipelines, track step-by-step progress in real-time, edit/review extracted fields, finalize records, and export results in JSON or CSV format.

---

## 🏗️ Architecture Overview

The system is built on a decoupled, asynchronous architecture to ensure document processing does not block request-response lifecycles.

```mermaid
graph TD
    Client[React/Next.js Client] -->|1. Upload / Actions| API[FastAPI Web Server]
    API -->|2. Persist Metadata| DB[(PostgreSQL Database)]
    API -->|3. Push Task| Broker[(Redis Message Broker)]
    Broker -->|4. Consume Task| Worker[Celery Asynchronous Worker]
    Worker -->|5. Update Stage & Result| DB
    Worker -->|6. Publish Progress Event| PubSub[Redis Pub/Sub Channel]
    PubSub -->|7. Stream SSE Event| API
    API -->|8. Push Live Timeline| Client
```

### Core Architecture Components:
1. **Web Server (FastAPI):** Exposes synchronous API endpoints for document uploads, job management (retrying, finalizing), document exports, and status checks.
2. **Asynchronous Task Queue (Celery):** Offloads computation-heavy processing stages (such as file reading, metadata extraction, parsing, and mocked key-value generation) from the HTTP thread pool.
3. **In-Memory Cache & Broker (Redis):** Acts as the Celery message broker and powers the Pub/Sub messaging layer that communicates job progress events from the worker processes to the web application.
4. **Server-Sent Events (SSE):** Provides real-time, unidirectional stream connection for client progress tracking without the configuration overhead of bidirectional WebSockets.
5. **Relational Database (PostgreSQL):** Stores metadata schemas, job execution logs, and both raw (`extracted_data`) and audited (`reviewed_data`) JSON payloads.

---

## 🛠️ Local Setup & Run Steps

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL** (running on `localhost:5432` with a database named `doc_processor` or configured in `.env`)
- **Redis** (running on `localhost:6379`)

### 1. Configuration Setup
Create a `.env` file in the `backend/` directory (or use the preconfigured defaults):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/doc_processor
REDIS_URL=redis://localhost:6379/0
UPLOAD_DIR=uploads
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 2. Run Backend API
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Run Celery Worker (Separate Terminal)
```bash
cd backend
# Windows (requires solo pool configuration for local event loops)
celery -A app.worker.celery_app worker --loglevel=info --pool=solo
# macOS/Linux
celery -A app.worker.celery_app worker --loglevel=info
```

### 4. Run Frontend App (Separate Terminal)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application dashboard.

---

## 📡 Expected API Surface

| Endpoint | Method | Description |
|---|---|---|
| `/api/documents/upload` | `POST` | Upload one or more files to the processor queue |
| `/api/documents/` | `GET` | List all documents with optional search & status filter |
| `/api/documents/{id}` | `GET` | Retrieve detailed document metadata and extracted data |
| `/api/documents/{id}/retry` | `POST` | Re-queue a failed document job |
| `/api/documents/{id}/review` | `PUT` | Edit/update the reviewed JSON data fields |
| `/api/documents/{id}/finalize` | `POST` | Lock document editing and finalize the extraction |
| `/api/documents/{id}/export` | `GET` | Download finalized result as `json` or `csv` (via `?format=json/csv`) |
| `/api/progress/{id}/stream` | `GET` | Server-Sent Events (SSE) stream for real-time progress events |

---

## 🧠 Architectural Tradeoffs & Decisions

### Server-Sent Events (SSE) vs WebSockets
We chose **SSE** over WebSockets for progress tracking. Because tracking job execution stages is unidirectional (worker $\rightarrow$ server $\rightarrow$ client), SSE is a lighter-weight protocol. It runs over standard HTTP, supports automatic reconnection out of the box, and bypasses proxy/firewall traversal bugs commonly found with WebSockets.

### Local Frontend Sorting vs Server-Side Sorting
To minimize database querying overhead and keep UI interactions instant, we implemented sorting (by Name, Date, and File Size) directly on the client-side. The database query automatically returns results sorted by `created_at DESC` to ensure fresh uploads are always at the top.

---

## 💡 Assumptions
- Database schema migrations are created automatically upon FastAPI app startup via SQLAlchemy's `Base.metadata.create_all()`.
- Simulated processing delays (e.g., `time.sleep`) are implemented inside worker tasks to mimic complex real-world text extraction, OCR, and mapping workflows.

---

## ⚠️ Limitations
- **File Storage System:** Currently saves uploaded documents onto the local file system. Production systems should implement an abstraction layer (e.g., AWS S3 bucket client).
- **Authentication & Authorization:** No authentication (JWT tokens or sessions) is included to keep the assignment focused strictly on the core queue processing patterns.
- **Task Cancellation:** Jobs can be retried but active Celery tasks cannot be aborted midway through the UI.
