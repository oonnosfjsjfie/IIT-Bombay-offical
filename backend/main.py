import uvicorn
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from services.ai_engine import (
    process_documents_to_summary,
    answer_question,
    generate_medicine_plan,
    generate_checkups,
    generate_schedule,
    translate_markdown,
)

app = FastAPI(title="Neutrix Core Engine APIs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Summary (one or more reports + optional pharmacy bills) ----------
@app.post("/api/summarize")
def summarize_documents(
    files: List[UploadFile] = File(...),
    bills: Optional[List[UploadFile]] = File(None),
    language: str = Form("English")
):
    documents = [(f.filename, f.file.read()) for f in files]
    bill_docs = [(b.filename, b.file.read()) for b in (bills or [])]

    result = process_documents_to_summary(documents, bill_docs, language)
    return {
        "filenames": [f.filename for f in files],
        "bill_filenames": [b.filename for b in (bills or [])],
        "transcription": result["transcription"],
        "bill_text": result["bill_text"],
        "summary": result["summary"],
        "ok": result["ok"],
    }


# ---------- Chat ----------
class ChatMessage(BaseModel):
    role: str
    text: str


class AskRequest(BaseModel):
    question: str
    report_text: str = ""
    language: str = "English"
    history: List[ChatMessage] = []


@app.post("/api/ask")
def ask_question(req: AskRequest):
    print(f"[ask] Question: {req.question}")
    history = [m.model_dump() for m in req.history]
    answer = answer_question(req.question, req.report_text, history, req.language)
    return {"answer": answer}


# ---------- Medicine plan, check-ups, schedule ----------
class PlanRequest(BaseModel):
    report_text: str
    bill_text: str = ""
    language: str = "English"


@app.post("/api/medicine-plan")
def medicine_plan(req: PlanRequest):
    print("[plan] Generating medicine plan...")
    text, ok = generate_medicine_plan(req.report_text, req.bill_text, req.language)
    return {"plan": text, "ok": ok}


@app.post("/api/checkups")
def checkups(req: PlanRequest):
    print("[checkups] Mapping check-ups...")
    text, ok = generate_checkups(req.report_text, req.language)
    return {"checkups": text, "ok": ok}


@app.post("/api/schedule")
def schedule(req: PlanRequest):
    print("[schedule] Building daily schedule...")
    doses, message, ok = generate_schedule(req.report_text, req.bill_text)
    return {"doses": doses, "message": message, "ok": ok}


# ---------- Translation ----------
class TranslateRequest(BaseModel):
    text: str
    target_language: str


@app.post("/api/translate")
def translate(req: TranslateRequest):
    print(f"[translate] -> {req.target_language} ({len(req.text)} chars)")
    text, ok = translate_markdown(req.text, req.target_language)
    return {"text": text, "ok": ok}


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
    