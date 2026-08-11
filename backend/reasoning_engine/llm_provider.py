import logging
import os
import json
import asyncio
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

logger = logging.getLogger(__name__)

LLM_API_KEY = os.getenv("LLM_API_KEY")
if not LLM_API_KEY:
    raise RuntimeError(
        "CRITICAL: LLM_API_KEY environment variable is missing. Halting startup."
    )

genai.configure(api_key=LLM_API_KEY)

NEVER_GUESS_PROMPT = """
CRITICAL RULE (NEVER-GUESS): 
If no evidence is found for a pattern, you MUST NOT fabricate a finding.
You must return status='Insufficient-Evidence', confidence_score=0.0, and an empty evidence list.
Do not force a best-guess label.
"""


class LLMProvider:
    @staticmethod
    async def _call_llm_internal(
        prompt: str, context: dict, schema_instructions: str = None
    ) -> dict:
        nodes = context.get("nodes", [])
        # To save tokens and avoid massive payloads for huge repos, we extract just the labels/types
        simplified_graph = [
            {"id": n.get("id"), "label": n.get("label"), "type": n.get("type")}
            for n in nodes
        ]
        graph_json = json.dumps(simplified_graph)

        default_schema = """
        {{
            "label": "String (e.g. E-Commerce, SaaS, CRM, Booking)",
            "confidence_score": 0.0,
            "reasoning_summary": "String",
            "evidence": [],
            "status": "Confirmed | Low-Confidence | Insufficient-Evidence"
        }}
        """

        active_schema = schema_instructions if schema_instructions else default_schema

        full_prompt = f"""
        {NEVER_GUESS_PROMPT}
        
        {prompt}
        
        Analyze this Knowledge Graph architecture and return ONLY valid JSON matching this exact schema:
        {active_schema}
        
        Do NOT wrap the response in ```json blocks. Return raw JSON.
        
        Knowledge Graph Data:
        {graph_json}
        """

        logger.info("Calling Gemini API...")
        # Use run_in_executor for the synchronous HTTP call so it doesn't block the async loop
        loop = asyncio.get_running_loop()

        def run_sync():
            try:
                model = genai.GenerativeModel("gemini-flash-latest")
                return model.generate_content(full_prompt)
            except Exception as e:
                logger.warning(
                    f"Failed with gemini-flash-latest, falling back to gemini-pro-latest: {e}"
                )
                model = genai.GenerativeModel("gemini-pro-latest")
                return model.generate_content(full_prompt)

        response = await loop.run_in_executor(None, run_sync)

        try:
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())
        except Exception as e:
            logger.error(
                f"Failed to parse Gemini JSON response: {response.text if hasattr(response, 'text') else str(e)}"
            )
            raise e

    @staticmethod
    async def call_llm(
        prompt: str,
        context: dict,
        max_retries: int = 3,
        base_delay: float = 1.0,
        schema_instructions: str = None,
    ) -> dict:
        for attempt in range(max_retries):
            try:
                return await LLMProvider._call_llm_internal(
                    prompt, context, schema_instructions
                )
            except Exception as e:
                err_msg = str(e).lower()
                # If it's a 4xx error (like context window too large, or invalid request), don't retry blindly
                if (
                    isinstance(e, google_exceptions.InvalidArgument)
                    or "400" in err_msg
                    or "context" in err_msg
                    or "too large" in err_msg
                ):
                    logger.error(
                        f"LLM 4xx Error (Context Window / Invalid). Bypassing retries. Error: {e}"
                    )
                    # Return a graceful fallback instead of crashing
                    return {
                        "category": "Analysis Skipped",
                        "label": "Unknown",
                        "confidence_score": 0.0,
                        "reasoning_summary": "Knowledge graph too large or invalid. Context window exceeded.",
                        "evidence": [],
                        "status": "Insufficient-Evidence",
                    }

                logger.warning(
                    f"LLM call failed (attempt {attempt + 1}/{max_retries}): {e}"
                )
                if attempt == max_retries - 1:
                    logger.error("LLM Provider exhausted all retries.")
                    raise
                await asyncio.sleep(base_delay * (2**attempt))
