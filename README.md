# Direct-Fit AI: Intelligent Recruitment Orchestration 🚀
### Revolutionizing Service Representative Screening for "Direct Insurance"

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://hr-ai-agents.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Framework-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini_2.0_Flash-4285F4?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

## 📝 Project Overview
Developed during a high-stakes Hackathon for **Direct Insurance (ביטוח ישיר)**, **Direct-Fit AI** is a multi-agent recruitment system designed to solve the critical challenge of screening service representative candidates. 

The system automates the initial assessment phase by combining digital footprint analysis with vocal behavioral signals, providing HR managers with a deep, psychologically-backed recommendation before the first human interaction.

---

## 🏗️ Architecture: The Triple-Agent System
The core of the system consists of three specialized AI agents that collaborate to build a complete candidate profile:

### 1. 🔍 The Digital Investigator (Agent 1)
*   **Role:** Analyzes the candidate's professional background and digital footprint.
*   **Engine:** Powered by **Tavily AI** for real-time web search and **Gemini 2.0 Flash** for analysis.
*   **Process:** Scours LinkedIn, resumes, and social profiles to verify stability, experience, and professional alignment with the job requirements.

### 2. 🎤 The Voice Insight Agent (Agent 2 - MVP Stage)
*   **Role:** Evaluates vocal communication and behavioral traits.
*   **Engine:** **Gemini Multimodal** (Audio-to-Insight).
*   **Process:** Currently, candidates upload a voice recording answering key questions. The agent analyzes tone, confidence, clarity, and service orientation.
*   **Vision:** Future iterations will feature a real-time interactive virtual interviewer.

### 3. 🧠 The Clinical Synthesizer (Agent 3 - "The Psychologist")
*   **Role:** Synthesizes all data into a final recommendation.
*   **Engine:** Advanced prompt engineering using **Gemini 2.0 Flash**.
*   **Output:** Generates a comprehensive report in Hebrew, identifying synergies and red flags (e.g., *"Strong LinkedIn profile but low energy in voice assessment"*).

---

## ⚙️ Extended Workflow & Automation (n8n)
The process doesn't end with analysis. The system triggers automated workflows based on the **Match Score**:

*   **High Match (Success Path):** Triggered via **n8n Webhooks**, sending a personalized email to the candidate: *"We found a great initial match! Our human team will contact you shortly for a formal interview."*
*   **Low Match (Reject Path):** Sends a respectful automated rejection via **n8n**: *"Thank you for your interest. Currently, we don't have a matching position for your profile."*
*   **HR Dashboard:** Real-time updates to a management dashboard showing candidate stats, graph visualizations, and contact status.

---

## 🛠️ Tech Stack
| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **AI / LLM** | Google Gemini 2.0 Flash (SDK), Tavily Search API |
| **Frontend** | React (Vite), TailwindCSS, Lucide Icons, Recharts |
| **Automation** | n8n (Webhooks), SMTP Email Services |
| **Infrastructure** | Docker, Render Cloud, `uv` Package Manager |

---

## 🚀 Getting Started

### Prerequisites
*   Python 3.11+
*   Google Gemini API Key
*   Tavily API Key

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/hr-ai-agents.git
   ```

2. **Install dependencies (using uv for speed):**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY_3=your_key
   GEMINI_API_KEY_4=your_key
   GEMINI_API_KEY_5=your_key
   TAVILY_API_KEY=your_key
   N8N_WEBHOOK_URL=your_webhook_url
   EMAIL_FROM=your_email
   EMAIL_PASSWORD=your_app_password
   EMAIL_TO=hr_manager_email
   ```

4. **Run the application:**
   ```bash
   python main.py
   ```
   The server will start at `http://localhost:8080`

---

## 🎯 Future Roadmap
*   **Live Virtual Interviewer:** Transforming Agent 2 from a file-uploader to a real-time RTC conversational AI.
*   **Predictive Retention:** Using historical data to predict which candidates are likely to stay long-term at Direct Insurance.
*   **CRM Integration:** Deep integration with HR management systems like Salesforce or Workday.

---

## 👥 The Team
*   **Chavi Berger**
*   **Noa Binet**
*   **Pessi Heineman**
*   **Ruti Maman**
*   **Racheli Saslo**

---

*Created with ❤️ for the Direct Insurance Hackathon.*

---


