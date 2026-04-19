import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

import json
import asyncio
import traceback
import uvicorn
import httpx
from fastapi import FastAPI, HTTPException, Form, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

# Email config
EMAIL_FROM = os.getenv("EMAIL_FROM", "")  # e.g. yourapp@gmail.com
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")  # Gmail App Password
EMAIL_TO = os.getenv("EMAIL_TO", "")  # HR manager email

from models import CandidateInput
from agents_services import (
    search_candidate_info,
    prepare_analysis_prompt,
    call_gemini_analyzer,
    analyze_audio_file,
    load_criteria_from_csv,
    RecruitmentAgent,
)
from validator import OutputValidator

app = FastAPI(title="Unified HR Recruitment API - Hackathon")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# N8N webhook URL - set in .env
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "")

# In-memory store of all analyzed candidates (for /candidates endpoint)
candidates_store: List[dict] = []

# Serve static frontend files
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

# Initialize agents lazily
psychologist_agent = None
output_validator = OutputValidator()


def get_psychologist_agent():
    global psychologist_agent
    if psychologist_agent is None:
        psychologist_agent = RecruitmentAgent()
    return psychologist_agent


@app.get("/")
def serve_frontend():
    return FileResponse("static/index.html")


@app.get("/health")
def health_check():
    return {"status": "up and running", "system": "Unified Hackathon API v1.0"}


# ===================================================================
# GET /candidates - Returns all analyzed candidates (for Racheli's dashboard)
# ===================================================================
@app.get("/candidates")
def get_candidates():
    return candidates_store


# ===================================================================
# POST /analyze - JSON endpoint (for Racheli's React frontend - NO audio)
# ===================================================================
@app.post("/analyze")
async def analyze_json(request: Request):
    """Endpoint for Racheli's React frontend - accepts JSON, no audio file"""
    try:
        body = await request.json()
        first_name = body.get("first_name", "")
        last_name = body.get("last_name", "")
        email = body.get("email", "")
        phone = body.get("phone", "")
        full_name = f"{first_name} {last_name}"

        print(f"\n🚀 --- [JSON] מתחיל תהליך עבור: {full_name} ---")

        # Only run Agent 1 (web search) + Agent 3 (psychologist) - no audio
        criteria = load_criteria_from_csv("requirements.csv")
        if not criteria:
            criteria = ["ניסיון רלוונטי", "יכולת טכנית", "התאמה תרבותית"]

        web_data = await search_candidate_info(first_name, last_name, email)
        analysis_prompt = prepare_analysis_prompt(full_name, web_data, criteria)
        social_profile_result = await call_gemini_analyzer(analysis_prompt)

        print("✅ סוכן 1 סיים")

        # Agent 3 - psychologist (with empty audio profile)
        empty_audio = {
            "status": "skipped",
            "candidate": full_name,
            "analysis_result": {"summary": "לא סופק קובץ אודיו", "match_percentage": 0}
        }

        formatted_candidate = CandidateInput(
            social_profile=social_profile_result,
            interaction_profile=empty_audio,
        )

        final_result = await get_psychologist_agent().run(formatted_candidate)

        # Inject email+phone into result
        if "dashboard_view" in final_result:
            final_result["dashboard_view"]["email"] = email
            final_result["dashboard_view"]["phone"] = phone

        validation_errors = output_validator.validate(final_result)

        response_data = {
            "success": True,
            "candidate_name": full_name,
            "email": email,
            "phone": phone,
            "analysis": final_result,
            "validation_warnings": validation_errors,
        }

        # Store for /candidates endpoint
        candidates_store.append(response_data)

        # Send notifications
        if N8N_WEBHOOK_URL:
            print("\n🚀 שולח נתונים ל-n8n...")
            await _send_to_n8n(final_result)
        _send_email_notification(response_data)

        print(f"[JSON] completed for {full_name}")
        return response_data

    except Exception as e:
        print(f"❌ שגיאה: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze_complete")
async def analyze_complete_candidate(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    audio_file: UploadFile = File(...),
):
    try:
        full_name = f"{first_name} {last_name}"
        print(f"\n🚀 --- מתחיל תהליך מלא עבור: {full_name} ---")

        # ==========================================================
        # שלב 1+2: סוכן חיפוש + סוכן אודיו - רצים במקביל!
        # ==========================================================
        print("🔍🎤 מפעיל סוכן רשת + סוכן אודיו במקביל...")

        criteria = load_criteria_from_csv("requirements.csv")
        if not criteria:
            criteria = ["ניסיון רלוונטי", "יכולת טכנית", "התאמה תרבותית"]

        file_content = await audio_file.read()

        # Run both agents at the same time!
        async def run_agent1():
            web_data = await search_candidate_info(first_name, last_name, email)
            analysis_prompt = prepare_analysis_prompt(full_name, web_data, criteria)
            return await call_gemini_analyzer(analysis_prompt)

        async def run_agent2():
            return await analyze_audio_file(file_content, audio_file.filename, full_name)

        social_profile_result, audio_profile_result = await asyncio.gather(
            run_agent1(), run_agent2()
        )

        print("✅ סוכן 1 סיים - פרופיל סושיאל:")
        print(json.dumps(social_profile_result, indent=2, ensure_ascii=False))
        print("✅ סוכן 2 סיים - פרופיל אודיו:")
        print(json.dumps(audio_profile_result, indent=2, ensure_ascii=False))

        # ==========================================================
        # שלב 3: הפסיכולוג (Gemini) מאחד את הכל
        # ==========================================================
        print("🧠 מפעיל את הפסיכולוג המסכם (Gemini)...")

        formatted_candidate = CandidateInput(
            social_profile=social_profile_result,
            interaction_profile=audio_profile_result,
        )

        final_result = await get_psychologist_agent().run(formatted_candidate)

        # Inject email+phone into result so N8N and frontend can use them
        if "dashboard_view" in final_result:
            final_result["dashboard_view"]["email"] = email or ""
            final_result["dashboard_view"]["phone"] = phone or ""

        # Validate output
        validation_errors = output_validator.validate(final_result)
        if validation_errors:
            print(f"⚠️ שגיאות ולידציה: {validation_errors}")

        print("\n✅ תהליך הושלם בהצלחה!")
        print(json.dumps(final_result, indent=2, ensure_ascii=False))

        response_data = {
            "success": True,
            "candidate_name": full_name,
            "email": email or "",
            "phone": phone or "",
            "analysis": final_result,
            "validation_warnings": validation_errors,
        }

        # Send notifications
        if N8N_WEBHOOK_URL:
            print("\n🚀 שולח נתונים ל-n8n...")
            await _send_to_n8n(final_result)
        _send_email_notification(response_data)

        # Store for /candidates endpoint
        candidates_store.append(response_data)

        return response_data

    except Exception as e:
        print(f"❌ שגיאה בתהליך העיבוד הראשי: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)


async def _send_to_n8n(data: dict):
    """Send analysis result to N8N webhook for candidate notifications"""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(N8N_WEBHOOK_URL, json=data)
            if resp.status_code == 200:
                print(f"✅ הנתונים נשלחו ל-n8n בהצלחה! המייל בדרך. status={resp.status_code}")
            else:
                print(f"⚠️ שגיאה בשליחה ל-n8n. סטטוס: {resp.status_code}, body: {resp.text}")
    except Exception as e:
        print(f"❌ שגיאת תקשורת מול n8n: {e}")


def _send_email_notification(data: dict):
    """Send email notification to HR manager about new candidate analysis"""
    if not EMAIL_FROM or not EMAIL_PASSWORD or not EMAIL_TO:
        print("Email not configured - skipping notification")
        return
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        analysis = data.get("analysis", {})
        dv = analysis.get("dashboard_view", {})
        details = analysis.get("interview_details", {})

        name = dv.get("full_name", data.get("candidate_name", ""))
        score = dv.get("match_percent", 0)
        status = dv.get("status", "")
        strengths = "\n".join(f"  - {s}" for s in details.get("strengths", []))
        weaknesses = "\n".join(f"  - {w}" for w in details.get("weaker_points", []))
        reasons = "\n".join(f"  - {r}" for r in details.get("score_reasons", []))

        body = (
            f"שלום,\n\n"
            f"התקבלה תוצאת ניתוח עבור מועמד חדש:\n\n"
            f"שם: {name}\n"
            f"אימייל: {data.get('email', '')}\n"
            f"טלפון: {data.get('phone', '')}\n"
            f"ציון התאמה: {score}/10 ({int(score*10)}%)\n"
            f"סטטוס: {status}\n\n"
            f"נקודות חוזק:\n{strengths}\n\n"
            f"נקודות לשיפור:\n{weaknesses}\n\n"
            f"נימוקי ציון:\n{reasons}\n\n"
            f"---\nמערכת סינון מועמדים - ביטוח ישיר"
        )

        msg = MIMEMultipart()
        msg["From"] = EMAIL_FROM
        msg["To"] = EMAIL_TO
        msg["Subject"] = f"מועמד חדש: {name} - ציון {int(score*10)}% - {status}"
        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_FROM, EMAIL_PASSWORD)
            server.send_message(msg)
        print(f"Email sent to {EMAIL_TO} about {name}")
    except Exception as e:
        print(f"Email failed (non-blocking): {e}")


# SPA catch-all: any route not matching API endpoints serves index.html
@app.get("/{full_path:path}")
async def spa_catchall(full_path: str):
    # Serve actual static files if they exist
    import os
    static_file = os.path.join("static", full_path)
    if os.path.isfile(static_file):
        return FileResponse(static_file)
    return FileResponse("static/index.html")
