"""
AI Investigation Assistant Service
Handles grounded LLM completions with Groq / OpenAI APIs, deterministic offline fallback,
and in-memory rate limiting (Section 15 & 23).
"""
import os
import json
import time
from typing import Dict, Any, Tuple, List
from collections import defaultdict
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

AI_API_KEY = os.getenv("AI_API_KEY", "")
AI_MODEL = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")
AI_BASE_URL = os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1")

# In-memory sliding window rate limiter: client_id -> [timestamps]
RATE_LIMIT_MAX_REQUESTS = 10
RATE_LIMIT_WINDOW_SECONDS = 60
_request_history = defaultdict(list)


def check_rate_limit(client_id: str = "default_client") -> bool:
    """Returns True if request is within allowed rate limits, False otherwise."""
    now = time.time()
    timestamps = _request_history[client_id]
    # Filter to timestamps in current window
    _request_history[client_id] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]
    if len(_request_history[client_id]) >= RATE_LIMIT_MAX_REQUESTS:
        return False
    _request_history[client_id].append(now)
    return True


def deterministic_offline_fallback(question: str, context: Dict[str, Any]) -> Tuple[str, List[str]]:
    """Generates structured, factual response directly from case context when AI is offline."""
    reasons = context.get("key_evidence", [])
    patterns = context.get("detected_patterns", [])
    case_title = context.get("case_title", "Investigation Case")
    risk_score = context.get("risk_score", 0.0)
    risk_level = context.get("risk_level", "Medium")
    money_flow = context.get("total_money_flow_inr", 0.0)
    entities = context.get("entities", [])
    devices = context.get("shared_devices", [])

    citations = []
    for p in patterns:
        citations.extend(p.get("transaction_ids", [])[:3])

    q_lower = question.lower()

    if "why" in q_lower or "suspicious" in q_lower or "evidence" in q_lower:
        lines = [
            f"**Deterministic Evidence Summary for {case_title}** (Investigation Risk Score: {risk_score:.0f}/100 — {risk_level.title()}):",
            "",
            "### Observed Evidence Signals:",
        ]
        for idx, r in enumerate(reasons, 1):
            lines.append(f"{idx}. {r}")

        if patterns:
            lines.append("")
            lines.append("### Detected Patterns:")
            for p in patterns:
                lines.append(f"- **{p.get('pattern_type', '').replace('_', ' ').title()}** ({p.get('severity', '').title()}): {p.get('evidence', '')}")

        lines.append("")
        lines.append(f"*Total volume under investigation: ₹{money_flow:,.2f} across {len(entities)} entities.*")
        return "\n".join(lines), citations[:5]

    elif "money" in q_lower or "trail" in q_lower or "flow" in q_lower or "hops" in q_lower:
        hops = context.get("money_trail_hops", [])
        lines = [
            f"**Money Trail Analysis for {case_title}:**",
            "",
        ]
        if hops:
            for h in hops:
                lines.append(
                    f"- **Hop {h.get('hop_number')}**: `{h.get('from_account_id')}` ➔ `{h.get('to_account_id')}` | "
                    f"₹{h.get('amount', 0):,.2f} at {h.get('timestamp')} (Txn: `{h.get('transaction_id')}`)"
                )
        else:
            lines.append("Funds disbursed from primary source across designated intermediary accounts.")

        return "\n".join(lines), citations[:5]

    elif "central" in q_lower or "organizer" in q_lower or "mule" in q_lower or "device" in q_lower:
        lines = [
            f"**Entity & Hardware Correlation:**",
            "",
        ]
        if devices:
            for d in devices:
                lines.append(f"- **Shared Device (`{d.get('fingerprint')[:14]}...`)**: Linked to {len(d.get('linked_accounts', []))} accounts: {', '.join(d.get('linked_accounts', []))}")
        lines.append("")
        lines.append("These entities form a coordinated network based on hardware fingerprint overlap and rapid transaction pass-through velocity.")
        return "\n".join(lines), citations[:5]

    else:
        lines = [
            f"**Investigation Summary ({case_title}):**",
            f"- **Risk Level**: {risk_level.title()} ({risk_score:.0f}/100)",
            f"- **Active Patterns**: {len(patterns)} flagged structures",
            f"- **Key Finding**: {reasons[0] if reasons else 'Multi-hop transaction routing detected.'}",
        ]
        return "\n".join(lines), citations[:5]


def ask_investigation_assistant(question: str, context: Dict[str, Any], client_id: str = "default_client") -> Dict[str, Any]:
    """Answers investigator queries using Groq LLM grounded strictly in structured JSON context."""
    if not check_rate_limit(client_id):
        return {
            "answer": "Rate limit exceeded (10 requests per minute). Please wait a moment before asking another question.",
            "grounded": True,
            "model": "rate-limiter",
            "citations": [],
            "fallback_used": True,
        }

    # If no API key configured, use deterministic evidence generator
    if not AI_API_KEY or "your_groq_api_key" in AI_API_KEY:
        answer, citations = deterministic_offline_fallback(question, context)
        return {
            "answer": answer,
            "grounded": True,
            "model": "deterministic-evidence-engine",
            "citations": citations,
            "fallback_used": True,
        }

    try:
        client = Groq(api_key=AI_API_KEY, base_url=AI_BASE_URL if AI_BASE_URL != "https://api.groq.com/openai/v1" else None)

        system_prompt = (
            "You are TraceFuse AI, a specialized financial crime and anti-money-laundering (AML) investigation assistant. "
            "Your task is to analyze the provided JSON investigation context and answer the investigator's question. "
            "STRICT GROUNDING RULES:\n"
            "1. Answer ONLY using the facts, entities, devices, amounts, and transaction IDs present in the JSON context.\n"
            "2. Never hallucinate or invent fake transaction IDs or accounts.\n"
            "3. If information is not in the context, explicitly state: 'The evidence does not contain records for that.'\n"
            "4. Whenever citing an observation, reference concrete evidence (e.g. Account IDs, Transaction IDs, amounts in INR, or timestamps).\n"
            "5. Structure responses cleanly using Markdown headers, bullet points, and bold text for clarity."
        )

        user_content = f"INVESTIGATION CONTEXT (JSON):\n```json\n{json.dumps(context, indent=2)}\n```\n\nINVESTIGATOR QUESTION:\n{question}"

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.2,
            max_tokens=800,
        )

        answer_text = response.choices[0].message.content or ""
        
        # Extract cited transaction IDs from context present in answer
        citations = []
        for p in context.get("detected_patterns", []):
            for tid in p.get("transaction_ids", []):
                if tid in answer_text and tid not in citations:
                    citations.append(tid)

        return {
            "answer": answer_text,
            "grounded": True,
            "model": AI_MODEL,
            "citations": citations,
            "fallback_used": False,
        }

    except Exception as e:
        print(f"[AIAssistant] LLM call failed ({e}). Falling back to deterministic engine.")
        answer, citations = deterministic_offline_fallback(question, context)
        return {
            "answer": answer,
            "grounded": True,
            "model": "deterministic-fallback",
            "citations": citations,
            "fallback_used": True,
        }
