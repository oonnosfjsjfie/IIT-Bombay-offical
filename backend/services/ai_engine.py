import os
import re
import json
import time
import datetime
from pathlib import Path

import pymupdf  # PyMuPDF
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load the API key from backend/.env (this file is never uploaded to GitHub)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing. Add it to backend/.env")

# Tried in this order. If one is busy, out of quota or not available, the next is used.
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

QUOTA_MESSAGE = (
    "Neutrix has reached its AI usage limit for now. "
    "Please try again later."
)

VALID_SLOTS = {"morning", "afternoon", "evening", "night", "unclear"}

REPORT_LIMIT = 12000   # characters of report text sent to the AI
BILL_LIMIT = 4000      # characters of bill text sent to the AI

# Create the Gemini client once and keep it
client = genai.Client(
    api_key=API_KEY,
    http_options=types.HttpOptions(timeout=30_000)  # 30 seconds per try
)


# ======================================================
# Helpers
# ======================================================
def is_quota_error(msg: str) -> bool:
    return "429" in msg or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower()


def generate(prompt: str, json_mode: bool = False) -> str:
    """Try each model. Retry busy models once; skip models that are out of quota or don't exist."""
    config = types.GenerateContentConfig(response_mime_type="application/json") if json_mode else None
    last_error = None
    for model in MODELS:
        for attempt in range(2):
            try:
                response = client.models.generate_content(model=model, contents=prompt, config=config)
                print(f"[ok] Answered by {model}")
                return response.text
            except Exception as e:
                last_error = e
                msg = str(e)
                if is_quota_error(msg):
                    print(f"[quota] {model} out of quota, trying next model")
                    break
                if "503" in msg or "UNAVAILABLE" in msg:
                    print(f"[busy] {model} busy (try {attempt + 1})")
                    time.sleep(1.5 * (attempt + 1))
                    continue
                if "404" in msg or "NOT_FOUND" in msg:
                    print(f"[skip] {model} not available on this key")
                    break
                print(f"[error] {model}: {msg}")
                break
    raise RuntimeError(f"All models failed. Last error: {last_error}")


def is_busy_error(err: Exception) -> bool:
    msg = str(err)
    return "503" in msg or "UNAVAILABLE" in msg or is_quota_error(msg)


def friendly_error(err: Exception) -> str:
    msg = str(err)
    if is_quota_error(msg):
        return QUOTA_MESSAGE
    if "503" in msg or "UNAVAILABLE" in msg:
        return BUSY_MESSAGE
    return f"AI processing failed: {err}"


def extract_pdf_text(file_bytes: bytes) -> str:
    text = ""
    with pymupdf.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()
    return text


def combine_documents(docs: list, label: str):
    """Extract text from several PDFs and join them with clear headers."""
    parts = []
    problems = []
    for name, data in docs:
        try:
            text = extract_pdf_text(data)
        except Exception as e:
            problems.append(f"'{name}' could not be read ({e})")
            continue
        if not text.strip():
            problems.append(f"'{name}' has no readable text (it may be a scanned image)")
            continue
        parts.append(f"===== {label}: {name} =====\n{text.strip()}")
    return "\n\n".join(parts), problems


def parse_json(raw: str):
    """Parse JSON from the model, removing ``` fences if present."""
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
    return json.loads(cleaned)


# ======================================================
# 1. Summary (one or more reports + optional pharmacy bills)
# ======================================================
def process_documents_to_summary(documents: list, bills: list, language: str) -> dict:
    print(f"[1] Received {len(documents)} report(s) and {len(bills)} bill(s)")

    report_text, report_problems = combine_documents(documents, "REPORT")
    bill_text, bill_problems = combine_documents(bills, "PHARMACY BILL")

    if not report_text.strip():
        details = "; ".join(report_problems) or "No readable text was found."
        return {"transcription": "", "bill_text": "",
                "summary": f"None of the medical reports could be read: {details}. Please upload digital PDFs (not scanned images).",
                "ok": False}

    problems = report_problems + bill_problems
    problem_note = ""
    if problems:
        problem_note = "Some uploaded files could not be read. Mention this briefly to the patient: " + "; ".join(problems)

    print(f"[2] Extracted {len(report_text)} chars (reports), {len(bill_text)} chars (bills). Calling Gemini...")

    bill_section = ""
    if bill_text.strip():
        bill_section = """
    - PHARMACY BILL OVERVIEW: List the billed medicines/items with quantity and amount exactly as printed on the bill(s), and the bill total(s).
      Then gently point out any medicine that is on the discharge list but not on the bill, or on the bill but not on the discharge list,
      and advise the patient to confirm with their pharmacist. Never invent prices or quantities."""

    prompt = f"""
    You are Neutrix, a safe, transparent healthcare information extraction assistant.
    The patient may have uploaded several medical documents (discharge summaries, lab reports, prescriptions).
    Read all of them and generate ONE structured, patient-friendly explanation in {language}.
    If the documents seem to be from different hospital visits or dates, say so briefly and keep their information clearly separated.

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
    - GENERAL SAFETY WARNING SIGNS (When to call emergency care){bill_section}

    {problem_note}

    MEDICAL REPORTS:
    {report_text[:REPORT_LIMIT]}

    PHARMACY BILLS (may be empty):
    {bill_text[:BILL_LIMIT]}
    """

    try:
        summary = generate(prompt)
        print("[3] Gemini replied.")
        return {"transcription": report_text, "bill_text": bill_text, "summary": summary, "ok": True}
    except Exception as api_err:
        print(f"[!] Gemini error: {api_err}")
        return {"transcription": report_text, "bill_text": bill_text,
                "summary": friendly_error(api_err), "ok": False}


# ======================================================
# 2. Medicine plan
# ======================================================
def generate_medicine_plan(report_text: str, bill_text: str, language: str):
    prompt = f"""
    You are Neutrix, a careful assistant that turns a patient's own medical documents into an easy daily medicine plan.
    Write everything in {language}, but keep medicine names in English letters.

    STRICT RULES:
    1. Use ONLY medicines and instructions written in the documents below. Never add a medicine.
    2. Never invent, calculate, or change a dose, strength, frequency, timing, or duration.
       Copy them exactly as written. If something is not written, write "Not stated – ask your doctor or pharmacist" (in {language}).
    3. Never tell the patient to stop or change a medicine.
    4. If several documents list different medicines, use the most recent discharge prescription and say so.
    5. If the documents contain no medicine list, say so clearly and suggest asking the doctor or pharmacist.

    OUTPUT FORMAT (Markdown):
    ## Daily Schedule
    Use "### " sub-headings for Morning, Afternoon, Evening, Night (in {language}). Under each, list the medicines taken then:
    - **Medicine name + strength**: dose as written, before/after food as written, and its purpose in a few simple words.
    Put medicines whose timing is not clear under a sub-heading "Timing not clear" (in {language}).

    ## Medicine Details
    A Markdown table with columns: Medicine | What it is for | How to take (as written) | How long (as written) | Notes

    ## Staying on Track
    3 to 5 short practical tips (pill organiser, phone alarms, keep the list with you, refill before running out,
    never stop a medicine without asking the doctor). If the pharmacy bill shows quantities, you may mention checking
    with the pharmacist when a refill is needed, without calculating dates.

    End with one line reminding them to check the printed pharmacy label.

    MEDICAL REPORTS:
    {report_text[:REPORT_LIMIT]}

    PHARMACY BILLS (may be empty):
    {bill_text[:BILL_LIMIT]}
    """
    try:
        return generate(prompt), True
    except Exception as e:
        print(f"[plan] Gemini error: {e}")
        return friendly_error(e), False


# ======================================================
# 3. Upcoming check-ups
# ======================================================
def generate_checkups(report_text: str, language: str):
    today = datetime.date.today().strftime("%d-%m-%Y")

    prompt = f"""
    You are Neutrix, a careful assistant that finds a patient's follow-up visits and tests in their medical documents.
    Today's date is {today} (DD-MM-YYYY). Write everything in {language}.

    TASK:
    Find every follow-up item in the documents: doctor review visits, lab/blood tests, scans, ECG/echo,
    dressing or stitch removal, physiotherapy, vaccinations, and similar.

    RULES:
    1. Use ONLY what the documents say. Never invent an appointment.
    2. If a date is written, use it exactly.
    3. If the timing is relative (for example "review after 1 week"), calculate an approximate date from the
       discharge date written in that document, and show how you got it, for example:
       "Approx. 22-10-2026 (1 week after discharge on 15-10-2026)".
       If no discharge date is written, do not calculate; just repeat the timing as written.
    4. Compare each date with today's date: mark it "Upcoming" or "Date has passed – contact the hospital to reschedule" (in {language}).
    5. Advise confirming exact dates and times with the hospital.

    OUTPUT FORMAT (Markdown):
    ## Your Check-up Timeline
    For each item, sorted by date (earliest first), write:
    ### 📅 [date] — [short title]
    - **What:** ...
    - **With / where:** (as written, or "Not stated")
    - **Why it matters:** one simple sentence
    - **How to prepare:** bring this summary and your medicine list; add special preparation (like fasting) ONLY if the document says so
    - **Status:** Upcoming / Date has passed

    ## Go to the Hospital Sooner If
    List the warning signs from the documents. If none are written, list a few general ones (chest pain, breathing trouble,
    fainting, high fever, bleeding) and say to seek emergency care.

    If the documents have no follow-up information at all, say so clearly and suggest calling the hospital to ask.

    MEDICAL REPORTS:
    {report_text[:REPORT_LIMIT]}
    """
    try:
        return generate(prompt), True
    except Exception as e:
        print(f"[checkups] Gemini error: {e}")
        return friendly_error(e), False


# ======================================================
# 4. Daily schedule (structured JSON for the tick-off page)
# ======================================================
def generate_schedule(report_text: str, bill_text: str):
    prompt = f"""
    You build a daily medicine schedule from a patient's own medical documents.
    Return ONLY JSON in exactly this shape:
    {{"doses": [
      {{"medicine": "Tab. Aspirin", "strength": "75 mg", "dose": "",
        "slot": "afternoon", "timing_assumed": false,
        "instruction_en": "Once daily after lunch", "instruction_ml": "ദിവസവും ഒരു തവണ ഉച്ചഭക്ഷണത്തിന് ശേഷം",
        "purpose_en": "Helps prevent blood clots", "purpose_ml": "രക്തം കട്ടപിടിക്കുന്നത് തടയാൻ സഹായിക്കുന്നു",
        "duration": "Continue"}}
    ]}}

    RULES:
    1. Use ONLY medicines in the discharge prescription / medicines-at-discharge list.
       If several documents list medicines, use the most recent discharge prescription.
       Do NOT add medicines that appear only on a pharmacy bill.
    2. Make ONE entry per time of day the medicine is taken. "slot" must be one of:
       morning, afternoon, evening, night, unclear.
       - after breakfast / morning -> morning; after lunch / noon -> afternoon; evening -> evening;
         at night / bedtime / after dinner -> night.
       - If only a frequency is written without times: once daily -> morning; twice daily -> morning and night;
         three times daily -> morning, afternoon and night. Set "timing_assumed": true for these.
       - If you cannot tell at all, use "unclear" with "timing_assumed": true.
    3. Copy strength, dose and duration exactly as written. Use "" for dose if not written. Never invent or change amounts.
    4. instruction_en: short how-to-take text as written. instruction_ml: the same in Malayalam.
    5. purpose_en: what the medicine is commonly used for, in 3 to 8 simple words. purpose_ml: the same in Malayalam.
    6. Keep medicine names in English letters.
    7. If there are no medicines, return {{"doses": []}}.

    MEDICAL REPORTS:
    {report_text[:REPORT_LIMIT]}

    PHARMACY BILLS (for reference only, do not schedule bill-only items):
    {bill_text[:BILL_LIMIT]}
    """
    try:
        raw = generate(prompt, json_mode=True)
    except Exception as e:
        print(f"[schedule] Gemini error: {e}")
        return [], friendly_error(e), False

    try:
        data = parse_json(raw)
        items = data.get("doses", []) if isinstance(data, dict) else data
    except Exception as e:
        print(f"[schedule] Bad JSON: {e}")
        return [], "Couldn't read the schedule from the AI. Please try again.", False

    doses = []
    for item in items:
        if not isinstance(item, dict) or not item.get("medicine"):
            continue
        slot = str(item.get("slot", "unclear")).lower().strip()
        if slot not in VALID_SLOTS:
            slot = "unclear"
        doses.append({
            "medicine": str(item.get("medicine", "")),
            "strength": str(item.get("strength", "") or ""),
            "dose": str(item.get("dose", "") or ""),
            "slot": slot,
            "timing_assumed": bool(item.get("timing_assumed", False)),
            "instruction_en": str(item.get("instruction_en", "") or ""),
            "instruction_ml": str(item.get("instruction_ml", "") or ""),
            "purpose_en": str(item.get("purpose_en", "") or ""),
            "purpose_ml": str(item.get("purpose_ml", "") or ""),
            "duration": str(item.get("duration", "") or ""),
        })

    if not doses:
        return [], "No medicines were found in the reports to schedule.", False
    print(f"[schedule] {len(doses)} doses")
    return doses, "", True


# ======================================================
# 5. Translation (summary, plans, chat)
# ======================================================
def translate_markdown(text: str, target_language: str):
    prompt = f"""
    Translate the text below into {target_language}.
    - Keep ALL Markdown formatting exactly (headings, bullet points, bold, tables, emojis).
    - Keep medicine names, strengths, doses, numbers, dates and phone numbers exactly as they are, in English letters and digits.
    - Do not add, remove or change any information. Do not add notes.
    - Output only the translated text.

    TEXT:
    {text}
    """
    try:
        return generate(prompt), True
    except Exception as e:
        print(f"[translate] Gemini error: {e}")
        return friendly_error(e), False


# ======================================================
# 6. Chat
# ======================================================
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

    PATIENT'S UPLOADED REPORTS (may be empty):
    {report_text[:REPORT_LIMIT]}

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