import uvicorn
from typing import List
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from services.ai_engine import process_document_to_summary, answer_question

app = FastAPI(title="Neutrix Core Engine APIs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/summarize")
def summarize_document(
    file: UploadFile = File(...),
    language: str = Form("English")
):
    contents = file.file.read()
    result = process_document_to_summary(contents, file.filename, language)
    return {
        "filename": file.filename,
        "transcription": result["transcription"],
        "summary": result["summary"]
    }


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


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)