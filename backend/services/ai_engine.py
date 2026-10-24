import time
import pymupdf  # PyMuPDF
from google import genai
from google.genai import types

API_KEY = "AQ.Ab8RN6K7hZgCu1Ec_ib_y3_G-CC8EqJxv-gpW6IJOsxF6m_Z4A"

# Tried in this order. If one is busy or not available, the next is used.
MODELS = [
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview",
]

BUSY_MESSAGE = (
    "Neutrix's AI service is very busy right now. "
    "Please wait a minute and try again."
)

# Create the Gemini client once and keep it
client = genai.Client(
    api_key=API_KEY,
    http_options=types.HttpOptions(timeout=25_000)  # 25 seconds per try
)


def generate(prompt: str) -> str:
    """Try each model. Retry busy models once, skip models that don't exist."""
    last_error = None
    for model in MODELS:
        for attempt in range(2):
            try:
                response = client.models.generate_content(model=model, contents=prompt)
                print(f"[ok] Answered by {model}")
                return response.text
            except Exception as e:
                last_error = e
                msg = str(e)
                if "503" in msg or "UNAVAILABLE" in msg or "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                    print(f"[busy] {model} busy (try {attempt + 1})")
                    time.sleep(1.5 * (attempt + 1))
                    continue
                if "404" in msg or "NOT_FOUND" in msg:
                    print(f"[skip] {model} not available on this key")
                    break  # go to the next model
                print(f"[error] {model}: {msg}")
                break  # unknown error: try the next model
    raise RuntimeError(f"All models failed. Last error: {last_error}")


def is_busy_error(err: Exception) -> bool:
    msg = str(err)
    return any(code in msg for code in ["503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED"])


def process_document_to_summary(file_bytes: bytes, filename: str, language: str) -> dict:
    print(f"[1] Received {filename}, extracting text...")
    extracted_text = ""
    try:
        with pymupdf.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                extracted_text += page.get_text()
    except Exception as e:
        return {
            "transcription": f"Failed to extract document contents: {e}",
            "summary": "AI processing failed due to extraction error."
        }

    if not extracted_text.strip():
        return {
            "transcription": "No readable text found. This looks like a scanned PDF (image only).",
            "summary": "Please upload a digital PDF. Scanned PDFs need OCR, which isn't set up yet."
        }

    print(f"[2] Extracted {len(extracted_text)} characters. Calling Gemini...")

    prompt = f"""
    You are Neutrix, a safe, transparent healthcare information extraction assistant.
    Analyze the provided document text and generate a structured, patient-friendly explanation in {language}.

    CRITICAL HEALTH & SAFETY COMPLIANCE DIRECTIONS:
    1. GENERAL INFORMATION ONLY: Do not issue personalized diagnosis or change prescribed home treatment courses.
    2. HEDGING LANGUAGE MANDATE: You must use soft, descriptive, hedging terms when addressing conditions or anomalies (e.g., use phrases like "resembles", "shares characteristics with", "is consistent with", "seems to be", "appears to show").
    3. DIFFERENTIAL TARGETING: If the documentation implies an underlying condition, you MUST present at least THREE distinct, non-definitive possibilities rather than concluding a fixed diagnosis.
    4. TRIAGE REMEDIATION: List at least THREE distinct general treatment options/avenues for recovery.
    5. LABEL VERIFICATION WARNING: You must include a prominent alert within your output reminding the patient to check their physically printed pharmacy labels.

    FORMATTING:
    - Use Markdown. Use "## " for each section heading, and write the section headings in {language} too.
    - Use bullet points for lists and **bold** for key terms like medicine names.
    - Keep paragraphs short. Do not use tables.

    Use these sections, in this order:
    - WHAT HAPPENED (Simplified explanation using strict hedging language)
    - MEDICATION OVERVIEW (List general parameters; append: "Make sure to double-check the physical label to confirm accurate dosing details")
    - HOME CARE CHANNELS (List at least 3 distinct general therapeutic options or recovery pathways)
    - COMPLIANCE AND FOLLOW-UP PLANS
    - GENERAL SAFETY WARNING SIGNS (When to call emergency care)

    Document Context:
    {extracted_text[:4000]}
    """

    try:
        summary = generate(prompt)
        print("[3] Gemini replied.")
        return {"transcription": extracted_text, "summary": summary}
    except Exception as api_err:
        print(f"[!] Gemini error: {api_err}")
        return {
            "transcription": extracted_text,
            "summary": BUSY_MESSAGE if is_busy_error(api_err) else f"AI Generation processing failed: {api_err}"
        }


def answer_question(question: str, report_text: str, history: list, language: str) -> str:
    history_text = "\n".join(
        f"{m['role'].upper()}: {m['text']}" for m in history[-6:]
    )

    prompt = f"""
    You are Neutrix Assistant, a careful health information helper for patients.
    Answer the patient's question in {language}, in simple words.
    Use Markdown: short paragraphs, bullet points, and **bold** for medicine names. Use "### " for small headings if needed. No tables.

    WHEN THE QUESTION IS ABOUT A MEDICINE, cover what is relevant from:
    - What it is and what it is commonly used for
    - How it works, in simple terms
    - Common side effects, and serious side effects that need urgent care
    - Who should avoid it or be careful (pregnancy, breastfeeding, kidney or liver problems, allergies)
    - Important interactions (other medicines, alcohol, food)
    - General age guidance as found on standard labeling (for example, whether it is generally used in children), without dose numbers
    - Benefits and risks in a balanced way. Do not label a medicine simply "good" or "bad".

    STRICT SAFETY RULES:
    1. Never give specific doses, mg/kg amounts, maximum daily amounts, or dosing schedules.
       Explain that the right dose depends on age, weight, health conditions and the exact product,
       and must come from the prescription label, the doctor, or a pharmacist.
       If the patient's own report below lists a dose, you may repeat exactly what the report says.
    2. Never tell the patient to start, stop, or change a prescribed medicine. Tell them to ask their doctor.
    3. Do not diagnose. Use careful wording like "may", "can", "is often used for".
    4. If the question describes emergency symptoms (chest pain, trouble breathing, severe allergic reaction,
       fainting, overdose), tell them to seek emergency care immediately, before anything else.
    5. If you do not recognise a medicine name or are unsure, say so honestly. Do not guess.
    6. If the question is not about health, politely say you can only help with medical report and medicine questions.

    PATIENT'S UPLOADED REPORT (may be empty):
    {report_text[:4000]}

    RECENT CONVERSATION:
    {history_text}

    PATIENT'S QUESTION:
    {question}
    """

    try:
        answer = generate(prompt)
        print("[ask] Gemini replied.")
        return answer
    except Exception as e:
        print(f"[ask] Gemini error: {e}")
        return BUSY_MESSAGE if is_busy_error(e) else f"Sorry, I couldn't answer right now: {e}"