# airi_desktop/airi_desktop.py
import cv2
import time
import sys
import os
from typing import Dict, Any

# Import local modules
import config
from vision_detector import LocalVisionDetector
from llm_client import OllamaLlmClient
from alert_manager import AlertManager


class AiriLocalCompanionApp:
    def __init__(self):
        print("==================================================")
        print("       Airi Offline Study Guardian Active         ")
        print("     100% Private, Local-First Architecture       ")
        print("==================================================")
        
        self.detector = LocalVisionDetector()
        self.llm_client = OllamaLlmClient()
        self.alerter = AlertManager()

        # State tracking for change filtration
        self.last_reported_state: Dict[str, Any] = {}
        self.last_llm_call_time = 0.0
        self.min_llm_interval = 15.0  # Force call at least once every 15s for status check
        
    def has_state_changed_significantly(self, current_state: Dict[str, Any]) -> bool:
        """
        Determines if there is a significant state shift that warrants immediate LLM analysis.
        Avoids spamming Ollama on every frame, protecting local system resources.
        """
        if not self.last_reported_state:
            return True

        # Check for direct distraction state transitions
        critical_keys = ["face_present", "phone", "eyes_closed", "yawning", "looking_away", "other_person"]
        for key in critical_keys:
            if current_state.get(key) != self.last_reported_state.get(key):
                # An important distraction status flipped!
                return True

        # If a significant amount of distraction time accumulated (e.g., over 10s change), flag it
        distraction_diff = abs(current_state.get("distraction_duration", 0) - self.last_reported_state.get("distraction_duration", 0))
        if distraction_diff >= 10:
            return True

        return False

    def run(self):
        """Main orchestrator capturing loop."""
        cap = cv2.VideoCapture(config.WEBCAM_INDEX)
        
        if not cap.isOpened():
            print(f"Critical Error: Could not open webcam index {config.WEBCAM_INDEX}. Please check your connection.", file=sys.stderr)
            return

        # Set frame properties for camera
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, config.FRAME_WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config.FRAME_HEIGHT)

        print("\n[CAMERA ONLINE] Tracking active. Press 'q' in the camera window to exit.")
        print("Studying with Airi... Focus your mind and let's work!")
        print("--------------------------------------------------\n")

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("Warning: Failed to capture webcam frame.", file=sys.stderr)
                    time.sleep(1)
                    continue

                # 1. Flip frame for natural mirror effect
                frame = cv2.flip(frame, 1)

                # 2. Extract metrics locally using MediaPipe + YOLO
                metrics = self.detector.process_frame(frame)

                # 3. Check if we should call the local Ollama LLM
                now = time.time()
                should_call_llm = (
                    self.has_state_changed_significantly(metrics) or 
                    (now - self.last_llm_call_time >= self.min_llm_interval)
                )

                if should_call_llm:
                    self.last_llm_call_time = now
                    self.last_reported_state = metrics.copy()

                    # Send only JSON metrics to local Ollama
                    print(f"\n[AI REPORTING] Sending metrics to local {config.OLLAMA_MODEL}...")
                    decision = self.llm_client.analyze_student_state(metrics)
                    
                    # Print current telemetry console readout
                    print(f"Metrics: Face={metrics['face_present']}, Phone={metrics['phone']}, EyesClosed={metrics['eyes_closed']}, LookAway={metrics['looking_away']}, OtherPerson={metrics['other_person']}")
                    print(f"Decision: Alert={decision.get('alert')}, Message=\"{decision.get('message')}\", Ignore={decision.get('ignore')}")

                    # 4. Trigger alert or speak companion response
                    if not decision.get("ignore", True):
                        self.alerter.trigger_alert(
                            decision.get("message", ""), 
                            force_alert=decision.get("alert", False)
                        )

                # 5. Render HUD feedback onto local camera frame
                self.draw_hud(frame, metrics)

                # Show camera preview
                cv2.imshow("Airi - Study Companion (Local Vision Node)", frame)

                # 'q' key to quit
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

        except KeyboardInterrupt:
            print("\nShutting down Airi local guardian gracefully...")
        finally:
            cap.release()
            cv2.destroyAllWindows()
            print("Goodbye Naveen! Great study session!")

    def draw_hud(self, frame, metrics: Dict[str, Any]):
        """Renders rich telemetry status overlay onto OpenCV preview window."""
        color_green = (46, 204, 113)
        color_red = (231, 76, 60)
        color_cyan = (52, 152, 219)
        color_yellow = (241, 196, 15)

        # Background cards for HUD text (black semi-transparent rects)
        cv2.rectangle(frame, (10, 10), (310, 160), (12, 13, 14), -1)
        cv2.rectangle(frame, (10, 10), (310, 160), (255, 255, 255), 1)

        # Title
        cv2.putText(frame, "AIRI TELEMETRY ENGINE", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color_cyan, 1)

        # Draw specific flags
        def draw_status(y_offset, label, status_bool):
            color = color_green if not status_bool else color_red
            if label == "Face Present":
                color = color_green if status_bool else color_red
                status_text = "PRESENT" if status_bool else "ABSENT"
            else:
                status_text = "TRUE" if status_bool else "FALSE"
            cv2.putText(frame, f"{label}: {status_text}", (20, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)

        draw_status(55, "Face Present", metrics["face_present"])
        draw_status(72, "Phone Usage", metrics["phone"])
        draw_status(89, "Sleepy/Eyes Closed", metrics["eyes_closed"])
        draw_status(106, "Yawning", metrics["yawning"])
        draw_status(123, "Looking Away", metrics["looking_away"])
        draw_status(140, "Other Person", metrics["other_person"])

        # Timer Card
        cv2.rectangle(frame, (10, height_bound := frame.shape[0] - 50), (250, frame.shape[0] - 10), (12, 13, 14), -1)
        cv2.rectangle(frame, (10, height_bound), (250, frame.shape[0] - 10), (255, 255, 255), 1)
        
        study_h_m_s = time.strftime('%H:%M:%S', time.gmtime(metrics["study_time"]))
        dist_h_m_s = time.strftime('%H:%M:%S', time.gmtime(metrics["distraction_duration"]))
        
        cv2.putText(frame, f"Study Session: {study_h_m_s}", (20, height_bound + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color_green, 1)
        cv2.putText(frame, f"Distracted:    {dist_h_m_s}", (20, height_bound + 32), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color_yellow, 1)


if __name__ == "__main__":
    app = AiriLocalCompanionApp()
    app.run()
