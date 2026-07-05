# airi_desktop/llm_client.py
import json
import urllib.request
import urllib.error
import sys
from typing import Dict, Any

# Import local config
import config


class OllamaLlmClient:
    def __init__(self):
        self.endpoint = f"{config.OLLAMA_URL}/api/generate"
        self.model = config.OLLAMA_MODEL

    def analyze_student_state(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends the offline structured metrics JSON (not images) to local Ollama.
        Forces structured JSON output explaining whether to play an alert.
        """
        system_instruction = (
            "You are Airi, Naveen's cheerful anime study companion. "
            "You are given a JSON representing Naveen's current real-time posture/activity metrics from local computer vision tracking. "
            "Analyze the metrics and determine if Naveen is focused or distracted. "
            "Return a clean JSON object with EXACTLY three fields:\n"
            '1. "alert": boolean (true if he is severely distracted or absent and needs a sound chime/audio prompt)\n'
            '2. "message": string (a very short, lively, cute, encouraging or warning anime comment under 15 words. Keep it supportive!)\n'
            '3. "ignore": boolean (true if he is focused, so we don\'t disrupt his deep work flow)\n'
            "\n"
            "Respond ONLY with valid JSON. Do NOT wrap in markdown blocks like ```json."
        )

        prompt = (
            f"{system_instruction}\n\n"
            f"CURRENT REAL-TIME STUDY METRICS:\n"
            f"{json.dumps(metrics, indent=2)}\n\n"
            f"DECISION:"
        )

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }

        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                self.endpoint,
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=8) as response:
                res_data = response.read().decode("utf-8")
                raw_json = json.loads(res_data)
                response_text = raw_json.get("response", "").strip()

                # Parse the response text as a JSON object
                try:
                    decision = json.loads(response_text)
                    # Validate keys
                    if "alert" in decision and "message" in decision and "ignore" in decision:
                        return decision
                except (json.JSONDecodeError, TypeError):
                    # Clean markdown wrappers if any
                    clean_str = response_text.replace("```json", "").replace("```", "").strip()
                    decision = json.loads(clean_str)
                    if "alert" in decision and "message" in decision and "ignore" in decision:
                        return decision

                # Fallback if parsed but incomplete
                return self._generate_local_rule_decision(metrics, "Core parsed structure mismatch.")

        except urllib.error.URLError as ue:
            print(f"Ollama network/connection error: {ue}", file=sys.stderr)
            return self._generate_local_rule_decision(metrics, "Ollama service unavailable.")
        except Exception as e:
            print(f"Ollama parsing exception: {e}", file=sys.stderr)
            return self._generate_local_rule_decision(metrics, f"Generic error: {e}")

    def _generate_local_rule_decision(self, metrics: Dict[str, Any], reason: str) -> Dict[str, Any]:
        """
        Failsafe offline rule-engine. If Ollama is turned off or busy,
        Airi still protects Naveen's workflow instantly with fully local rules!
        """
        # Determine distraction
        is_distracted = False
        message = "You are doing amazing, Naveen! Let's keep studying together!"
        alert = False
        ignore = True

        if not metrics.get("face_present", False):
            is_distracted = True
            message = "Naveen, where did you go? Airi is waiting for you!"
            alert = True
            ignore = False
        elif metrics.get("phone", False):
            is_distracted = True
            message = "Hey! No phone allowed during focus time, Naveen!"
            alert = True
            ignore = False
        elif metrics.get("eyes_closed", False):
            is_distracted = True
            message = "Naveen, are you getting sleepy? Shake it off or take a quick stretch!"
            alert = True
            ignore = False
        elif metrics.get("yawning", False):
            is_distracted = True
            message = "A big yawn! Drink some water and keep going, Naveen!"
            alert = False
            ignore = False
        elif metrics.get("looking_away", False):
            is_distracted = True
            message = "Naveen, eyes on the screen! Focus!"
            alert = False
            ignore = False
        elif metrics.get("other_person", False):
            is_distracted = True
            message = "Naveen, let's avoid side chatter and stick to the books!"
            alert = False
            ignore = False

        if is_distracted:
            return {
                "alert": alert,
                "message": f"[Failsafe - {reason}] {message}",
                "ignore": ignore
            }
        
        return {
            "alert": False,
            "message": f"[Failsafe] {message}",
            "ignore": True
        }
