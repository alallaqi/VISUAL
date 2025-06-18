# 🦁 Wildlife Narration Web App (Lit + AI)

A web-based proof-of-concept for **real-time narration of animal behavior** from **live YouTube animal streams**, designed for **Blind and visually impaired users**. Built with modern Web Components (Lit), Yolo.v8(Object recognition with tracking extension), RAG + LLM pipelines, and text to speech synthesis.

---

## 📸 Features

- Watch live animal cams (YouTube Live)
- Detect and narrate animal behavior and scnery using AI
- Narration style filter: **adults** or **minors**
- Narration style filter: **Field scientist** or **Safari adventurer** or **Calm observer**
- Browser-based text-to-speech (TTS)
- On-demand inference (runs only when narration is requested)


---

## 🧠 System Architecture

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant Backend
    participant FrameGrabber
    participant ObjectDetector
    participant Tracker
    participant RAGRetriever
    participant LLM
    participant TTS

    User->>WebApp: Click "Start Narration"
    WebApp->>Backend: Signal to start processing
    Backend->>FrameGrabber: Start video stream (yt-dlp + ffmpeg)
    loop Every N seconds
        FrameGrabber->>ObjectDetector: Send current frame
        ObjectDetector-->>Backend: Return detected animals
        Backend->>Tracker: Track movement, infer behavior
        Tracker-->>Backend: Structured event (e.g. "Panda eating")
        Backend->>RAGRetriever: Query metadata DB
        RAGRetriever-->>Backend: Return facts (e.g. "Pandas eat 40lb bamboo/day")
        Backend->>LLM: Prompt with event + facts + user type
        LLM-->>Backend: Return narration text
        Backend->>TTS: Convert text to audio
        TTS-->>WebApp: Play narration (Web Speech API or audio stream)
    end
    User-->>WebApp: Click "Stop Narration"
    WebApp->>Backend: Signal to stop processing
```

---

## 🧱 Tech Stack

| Layer            | Tool/Library                        |
|------------------|------------------------------------|
| Frontend         | Lit, Tailwind CSS                   |
| Stream Source    | YouTube Live via [yt-dlp]           |
| Frame Capture    | FFmpeg / OpenCV                     |
| Object Detection | YOLOv8 / HuggingFace DETR           |
| Behavior Logic   | DeepSORT / custom heuristics        |
| Metadata         | LangChain + FAISS (RAG)             |
| Language Model   | OpenAI GPT-4 / LLaMA                |
| Text-to-Speech   | Web Speech API or Google TTS        |

---

## 🧪 Quickstart

### One-Command Setup & Development

1. **Clone and setup everything**

   ```bash
   git clone <this-repo-url>
   cd wildlife-narration-web-app
   
   # Install all dependencies (Node.js + Python)
   npm run setup
   ```

2. **Start both frontend and backend**

   ```bash
   # Runs both servers concurrently
   npm run dev
   ```

   This will start:
   - **Frontend**: http://localhost:3001 (Vite dev server)
   - **Backend API**: http://localhost:8000 (FastAPI)
   - **API Docs**: http://localhost:8000/docs

### Individual Development Commands

If you need to run servers separately:

```bash
# Frontend only (Lit + Vite)
npm run dev:frontend

# Backend only (FastAPI + Python)
npm run dev:backend
```

### Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Install Node.js dependencies
npm install

# Setup Python virtual environment and dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 💡 How It Works

- The frontend displays a grid of categorized YouTube Live streams.
- When a user clicks "Narrate," the backend:
  1. Fetches frames from the stream
  2. Runs object detection (YOLO, DETR)
  3. Tracks animal movement
  4. Infers actions (e.g. eating, walking)
  5. Retrieves facts via RAG (LangChain + FAISS)
  6. Sends all to an LLM (e.g. GPT-4) for a 1–2 sentence narration
  7. Sends narration text to browser for speech via Web Speech API

---

## 👩‍🦯 Accessibility

- Designed for screen reader users and blind individuals
- Narration adapts to user age:
  - **Adult:** full factual description
  - **Minor:** child-appropriate filtering
- Narration uses a clear, calm TTS voice

---

## 🚧 Roadmap / To-Do

- [ ] Hook up real backend (FastAPI or Node) with frame processor
- [ ] Use yt-dlp to extract direct stream URL
- [ ] Integrate YOLOv8 from HuggingFace or Ultralytics
- [ ] Add LangChain-based metadata lookup
- [ ] Plug in OpenAI GPT or local LLM
- [ ] Offer multilingual narration (e.g. Arabic, German)
- [ ] Add analytics (optional for zoo partners)

---

## 🧩 Credits & Sources

- Explore.org for video sources
- OpenAI for GPT access
- HuggingFace for object detection models
- LangChain for RAG architecture
- Tailwind CSS for frontend styling

---

## 🆘 Questions?

If you'd like help wiring the backend, selecting models, or optimizing for edge devices — reach out or open an issue in the repo!