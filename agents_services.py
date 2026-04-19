import os
import csv
import json
import asyncio
import shutil
import tempfile
import httpx
from tavily import TavilyClient
from google import genai
from google.genai import types
from dotenv import load_dotenv
from models import CandidateInput
from prompts import SYSTEM_PROMPT

load_dotenv()
GEMINI_KEY_AGENT1 = os.getenv("GEMINI_API_KEY_3")    # Agent 1 (web search)
GEMINI_KEY_AGENT2 = os.getenv("GEMINI_API_KEY_4")    # Agent 2 (audio)
GEMINI_KEY_AGENT3 = os.getenv("GEMINI_API_KEY_5")    # Agent 3 (psychologist)
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

tavily_client = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None

# 3 separate GenAI clients - one per agent!
genai_client_1 = genai.Client(api_key=GEMINI_KEY_AGENT1) if GEMINI_KEY_AGENT1 else None
genai_client_2 = genai.Client(api_key=GEMINI_KEY_AGENT2) if GEMINI_KEY_AGENT2 else None
genai_client_3 = genai.Client(api_key=GEMINI_KEY_AGENT3) if GEMINI_KEY_AGENT3 else None


# ====================================================
# Helper: call Gemini via SDK (much better than REST!)
# ====================================================

def _call_gemini_sdk(client_obj, prompt: str, label: str, temperature: float = 0.4, max_retries: int = 3):
    """Synchronous SDK call - runs in thread via asyncio, with retries"""
    import time
    for attempt in range(max_retries):
        try:
            print(f"  📡 {label} - שולח בקשה ל-Gemini SDK (ניסיון {attempt+1})...")
            response = client_obj.models.generate_content(
                model='gemini-2.5-flash',
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_mime_type='application/json',
                    temperature=temperature
                )
            )
            result = json.loads(response.text)
            print(f"  ✅ {label} - הצלחה!")
            return result
        except Exception as e:
            err_str = str(e)
            if '429' in err_str and attempt < max_retries - 1:
                wait = (attempt + 1) * 10
                print(f"  ⏳ {label} - rate limit, ממתין {wait} שניות...")
                time.sleep(wait)
            else:
                raise
    raise Exception(f"{label} - כל הניסיונות נכשלו")


# ====================================================
# Agent 1: Web Search (Tavily) + Social Profile (KEY 1)
# ====================================================

def load_criteria_from_csv(file_path="requirements.csv"):
    criteria_list = []
    try:
        with open(file_path, mode='r', encoding='utf-8') as file:
            reader = csv.reader(file)
            for row in reader:
                if row:
                    criteria_list.append(row[0].strip())
        return criteria_list
    except Exception:
        return []


async def search_candidate_info(first_name: str, last_name: str, email: str):
    if not tavily_client:
        return "Search disabled: No API Key found."
    full_name = f"{first_name} {last_name}"
    queries = [
        f"{full_name} LinkedIn profile",
        f"{full_name} {email}" if email else f"{full_name} resume",
    ]
    try:
        context = ""
        for q in queries:
            response = tavily_client.search(query=q, search_depth="basic", max_results=3)
            for res in response.get('results', []):
                context += f"Source: {res.get('url')}\nContent: {res.get('content')[:500]}\n\n"
        return context if context else "No info found."
    except Exception as e:
        return f"Search error: {str(e)}"


def prepare_analysis_prompt(candidate_name, web_info, criteria):
    criteria_text = "\n".join([f"- {c}" for c in criteria])
    return f"""
    You are an expert HR. Analyze candidate: {candidate_name}.
    
    WEB DATA:
    {web_info}

    CRITERIA:
    {criteria_text}

    Return ONLY a JSON object:
    {{
        "candidate_name": "{candidate_name}",
        "match_percentage": 85,
        "detailed_scores": {{}},
        "summary": "Hebrew summary here",
        "sources": [],
        "recommendation": "Proceed/Hold"
    }}
    """


async def call_gemini_analyzer(prompt: str):
    """Agent 1 - tries all available keys if rate limited"""
    clients = [(genai_client_1, "key3"), (genai_client_2, "key4"), (genai_client_3, "key5")]
    for client, key_name in clients:
        if not client:
            continue
        try:
            result = await asyncio.to_thread(_call_gemini_sdk, client, prompt, f"סוכן 1 ({key_name})")
            return result
        except Exception as e:
            print(f"  ⚠️ סוכן 1 ({key_name}) נכשל: {str(e)[:100]}")
            continue
    return {"match_percentage": 0, "summary": "כל מפתחות ה-API חסומים כרגע"}


# ====================================================
# Agent 2: Audio Analysis with Gemini (REAL - uses KEY 1 via google-genai SDK)
# ====================================================

async def analyze_audio_file(file_content: bytes, filename: str, candidate_name: str = "") -> dict:
    """ניתוח קובץ שמע עם Gemini - מעלה את הקובץ ומנתח אותו"""
    if not genai_client_2:
        print("  ❌ סוכן 2 - אין GEMINI_API_KEY_4, מחזיר fallback")
        return _audio_fallback()

    # Save to temp file
    temp_path = f"temp_{filename}"
    try:
        with open(temp_path, "wb") as f:
            f.write(file_content)

        print(f"  📤 סוכן 2 - מעלה {filename} ל-Gemini...")
        uploaded_file = genai_client_2.files.upload(file=temp_path)

        # Wait for processing
        while uploaded_file.state.name == "PROCESSING":
            print("  ⏳ סוכן 2 - Gemini מעבד את האודיו...")
            await asyncio.sleep(3)
            uploaded_file = genai_client_2.files.get(name=uploaded_file.name)

        if uploaded_file.state.name == "FAILED":
            print("  ❌ סוכן 2 - עיבוד האודיו נכשל")
            return _audio_fallback()

        prompt = f"""
        Role: Senior HR Analyst at 'Direct Insurance'.
        Task: Analyze the audio recording of the candidate: {candidate_name}.

        Evaluation Instructions:
        - Listen for vocal cues: confidence, empathy, service-orientation, and energy.
        - Provide scores (1-10) for each criteria in the JSON.
        - Write a deep, professional summary in HEBREW.
        - Return ONLY a JSON object.
        - Calculate the match_percentage as an average of all detailed_scores.

        STRICT JSON STRUCTURE:
        {{
            "status": "success",
            "candidate": "{candidate_name}",
            "analysis_result": {{
                "candidate_name": "{candidate_name}",
                "match_percentage": 0,
                "detailed_scores": {{
                    "Fluent_Communication": 0,
                    "Punctuality": 0,
                    "Integrity_Reliability": 0,
                    "Career_Stability": 0,
                    "Efficiency_Agility": 0,
                    "High_Energy_Motivation": 0,
                    "Adaptability_Inclusion": 0,
                    "Target_Age_Group": 0,
                    "Clean_Record": 0,
                    "Team_Player": 0,
                    "Active_Listening": 0,
                    "Customer_Centricity": 0,
                    "Overall": 0
                }},
                "summary": "Full professional Hebrew evaluation...",
                "sources": [],
                "recommendation": "Proceed / Hold / Reject"
            }}
        }}
        """

        print("  🧠 סוכן 2 - מנתח אודיו עם Gemini...")
        response = genai_client_2.models.generate_content(
            model='gemini-2.5-flash',
            contents=[uploaded_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type='application/json'
            )
        )

        result = json.loads(response.text)
        print(f"  ✅ סוכן 2 - ניתוח אודיו הושלם!")
        return result

    except Exception as e:
        print(f"  ❌ סוכן 2 - שגיאה: {str(e)}")
        return _audio_fallback()
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def _audio_fallback() -> dict:
    return {
        "scores": {
            "communication_score": 5, "confidence_score": 5, "clarity": 5
        },
        "qualitative_data": {
            "ai_insight": "ניתוח האודיו נכשל - שרת ה-AI היה עמוס. נסו שוב."
        }
    }


# ====================================================
# Agent 3: Gemini Psychologist (KEY 2 - separate!)
# ====================================================

class RecruitmentAgent:
    def __init__(self):
        if not genai_client_3:
            raise ValueError("Missing GEMINI_API_KEY_5 in .env file")

    async def run(self, candidate_input: CandidateInput) -> dict:
        user_prompt = self._build_user_prompt(candidate_input)
        full_prompt = f"{SYSTEM_PROMPT}\n\n{user_prompt}"

        # Try all 3 keys in order
        clients = [(genai_client_3, "key5"), (genai_client_2, "key4"), (genai_client_1, "key3")]
        for client, key_name in clients:
            if not client:
                continue
            try:
                result = await asyncio.to_thread(_call_gemini_sdk, client, full_prompt, f"סוכן 3 ({key_name})", 0.1)
                return result
            except Exception as e:
                print(f"  ⚠️ סוכן 3 ({key_name}) נכשל: {str(e)[:100]}")
                continue
        return self._fallback_result(candidate_input)

    def _build_user_prompt(self, candidate_input: CandidateInput) -> str:
        return f"""
        Extract the candidate's full name from the profiles and analyze.

        SOCIAL PROFILE:
        {json.dumps(candidate_input.social_profile, indent=2, ensure_ascii=False)}

        INTERACTION PROFILE:
        {json.dumps(candidate_input.interaction_profile, indent=2, ensure_ascii=False)}
        """

    def _fallback_result(self, candidate_input: CandidateInput) -> dict:
        name = candidate_input.social_profile.get("candidate_name", "לא ידוע")
        return {
            "dashboard_view": {
                "full_name": name, "email": "", "phone": "",
                "match_percent": 5.0, "status": "בינוני"
            },
            "interview_details": {
                "graph": {
                    "communication": 5, "confidence": 5, "reliability": 5,
                    "role_fit": 5, "motivation": 5, "availability": 5,
                    "stability": 5, "customer_orientation": 5, "clarity": 5,
                    "engagement": 5
                },
                "strengths": ["שרת ה-AI היה עמוס - נסו שוב בעוד דקה"],
                "weaker_points": ["שרת ה-AI היה עמוס - נסו שוב בעוד דקה"],
                "score_reasons": ["לא בוצע ניתוח - מגבלת קריאות API. נסו שוב."]
            }
        }
