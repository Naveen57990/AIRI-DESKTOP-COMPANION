# airi_desktop/alert_manager.py
import os
import time
import sys
import subprocess

# Import local config
import config


class AlertManager:
    def __init__(self):
        self.last_alert_time = 0.0
        self.cooldown = config.ALERT_COOLDOWN_SEC
        self.voice = config.ALERT_VOICE
        self.sound_path = config.ALERT_SOUND_PATH

    def trigger_alert(self, message: str, force_alert: bool = False):
        """
        Triggers a local alert sound and speaks the anime message.
        Enforces cooldown threshold to avoid disturbing Naveen repeatedly.
        """
        now = time.time()
        
        # Check if we are outside of cooldown, or if it is a forced emergency alert
        if force_alert or (now - self.last_alert_time >= self.cooldown):
            self.last_alert_time = now
            print(f"\n[ALERT TRIGGERED] Airi: \"{message}\"")

            # 1. Play alert chime (sound effect)
            self.play_chime()

            # 2. Text-to-Speech
            self.speak(message)
        else:
            print(f"[COOLDOWN ACTIVE] Silent notice: Airi would say \"{message}\"")

    def play_chime(self):
        """Plays a gentle native macOS chime or basic system beep if on another OS."""
        try:
            if sys.platform == "darwin" and os.path.exists(self.sound_path):
                # Use macOS background audio player
                subprocess.Popen(["afplay", self.sound_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            elif sys.platform == "win32":
                import winsound
                winsound.Beep(1000, 300)
            else:
                # Terminal beep for standard Linux/other Unix environments
                sys.stdout.write("\a")
                sys.stdout.flush()
        except Exception as e:
            print(f"Failed to play chime: {e}", file=sys.stderr)

    def speak(self, text: str):
        """Uses macOS native text-to-speech, or fallback shell logs."""
        try:
            if sys.platform == "darwin":
                # Use macOS 'say' in background to keep GUI responsive
                # Sanitize text for bash injection
                safe_text = text.replace("'", "").replace('"', "")
                subprocess.Popen(["say", "-v", self.voice, safe_text], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                print(f"Speech (Console only on this OS): \"{text}\"")
        except Exception as e:
            print(f"Speech synthesis error: {e}", file=sys.stderr)
