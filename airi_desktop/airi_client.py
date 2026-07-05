# airi_desktop/airi_client.py
import sys
import os
import cv2
import json
import time
import threading
from typing import Dict, Any

try:
    from PySide6.QtCore import Qt, QTimer, Slot, QPoint
    from PySide6.QtWidgets import QApplication, QMainWindow, QLabel, QVBoxLayout, QWidget
    from PySide6.QtGui import QImage, QPixmap, QPainter, QColor, QFont
except ImportError:
    print("Warning: PySide6 is missing. Install with: pip install PySide6")
    sys.exit(1)

# Try importing websocket-client
try:
    import websocket
except ImportError:
    print("Warning: websocket-client is missing. Install with: pip install websocket-client")
    websocket = None

# Import local modules
import config
from vision_detector import LocalVisionDetector
from llm_client import OllamaLlmClient
from alert_manager import AlertManager


class AiriDesktopWidget(QMainWindow):
    def __init__(self):
        super().__init__()
        self.init_ui()
        
        # Load local components
        self.detector = LocalVisionDetector()
        self.llm_client = OllamaLlmClient()
        self.alerter = AlertManager()

        # Telemetry / timing parameters
        self.last_reported_state: Dict[str, Any] = {}
        self.last_llm_time = 0.0
        self.llm_interval = 15.0  # Run Ollama analysis at least once every 15s

        # Initialize Camera
        self.cap = cv2.VideoCapture(config.WEBCAM_INDEX)
        if not self.cap.isOpened():
            print(f"Warning: Webcam {config.WEBCAM_INDEX} could not be initialized.")
        
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)

        # Set up a high-speed tracking frame timer (~30 FPS)
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.run_frame_pipeline)
        self.timer.start(33)

        # Start background websocket connection to FastAPI hub
        self.ws = None
        self.ws_thread = threading.Thread(target=self.connect_local_backend, daemon=True)
        self.ws_thread.start()

    def init_ui(self):
        """Initializes macOS/Windows transparent, stays-on-top, floating desktop assistant UI."""
        self.setWindowTitle("Airi Desktop Companion")
        self.setGeometry(100, 100, 260, 280)

        # Make window transparent, frameless, and floating on top
        self.setAttribute(Qt.WA_TranslucentBackground, True)
        self.setAttribute(Qt.WA_NoSystemBackground, True)
        self.setWindowFlags(
            Qt.FramelessWindowHint | 
            Qt.WindowStaysOnTopHint | 
            Qt.SubWindow
        )

        # Main widget & layout
        self.central_widget = QWidget(self)
        self.layout = QVBoxLayout(self.central_widget)
        self.layout.setContentsMargins(10, 10, 10, 10)

        # Text dialogue balloon bubble
        self.bubble_label = QLabel("Airi: Ready to study!", self.central_widget)
        self.bubble_label.setStyleSheet("""
            background-color: rgba(20, 21, 23, 210);
            color: #ff7597;
            border: 1px solid rgba(255, 117, 151, 80);
            border-radius: 12px;
            padding: 8px;
            font-size: 11px;
            font-family: 'Courier New', monospace;
        """)
        self.bubble_label.setWordWrap(True)
        self.bubble_label.setAlignment(Qt.AlignCenter)
        self.layout.addWidget(self.bubble_label)

        # Avatar indicator card
        self.avatar_label = QLabel(self.central_widget)
        self.avatar_label.setAlignment(Qt.AlignCenter)
        self.layout.addWidget(self.avatar_label)

        # Draw default focused avatar state
        self.update_avatar("focused")

        self.setCentralWidget(self.central_widget)
        self.show()

        # Drag window helper state
        self.drag_position = QPoint()

    def update_avatar(self, mood: str):
        """Generates simple, distinctive visual emoji-based companion renders."""
        mood_emojis = {
            "focused": "🌸 (^_^) 🌸\nAiri: Focus Mode",
            "phone": "🚫 (ಠ_ಠ) 🚫\nNo Phones!",
            "sleepy": "💤 (u_u) 💤\nWake Up!",
            "absent": "❓ (o_o) ❓\nWhere are you?",
            "looking_away": "👀 (⇀_⇀) \nLook here!",
            "other_person": "👥 (•_•)\nFocus, Naveen!"
        }
        emoji = mood_emojis.get(mood, "🌸 (^_^) 🌸")
        self.avatar_label.setText(emoji)
        self.avatar_label.setStyleSheet(f"""
            color: {"#ff7597" if mood == "focused" else "#00ffd2"};
            font-size: 20px;
            font-weight: bold;
            font-family: 'Trebuchet MS', sans-serif;
            border: 2px dashed rgba(255, 255, 255, 20);
            border-radius: 16px;
            padding: 15px;
            background-color: rgba(12, 13, 14, 180);
        """)

    def mousePressEvent(self, event):
        """Allows clicking and dragging the transparent companion anywhere on the screen."""
        if event.button() == Qt.LeftButton:
            self.drag_position = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        if event.buttons() == Qt.LeftButton:
            self.move(event.globalPosition().toPoint() - self.drag_position)
            event.accept()

    @Slot()
    def run_frame_pipeline(self):
        """Webcam capture and local offline processing sequence (~30 FPS)."""
        if not self.cap.isOpened():
            return

        ret, frame = self.cap.read()
        if not ret:
            return

        frame = cv2.flip(frame, 1)

        # Process frame locally
        metrics = self.detector.process_frame(frame)

        # Update character avatar face based on current detection status
        if not metrics["face_present"]:
            self.update_avatar("absent")
        elif metrics["phone"]:
            self.update_avatar("phone")
        elif metrics["eyes_closed"]:
            self.update_avatar("sleepy")
        elif metrics["looking_away"]:
            self.update_avatar("looking_away")
        elif metrics["other_person"]:
            self.update_avatar("other_person")
        else:
            self.update_avatar("focused")

        # Check significant state flips to throttle Ollama queries
        now = time.time()
        should_call_llm = self.has_state_changed(metrics) or (now - self.last_llm_time >= self.llm_interval)

        if should_call_llm:
            self.last_llm_time = now
            self.last_reported_state = metrics.copy()

            # Execute Local LLM Ollama request on background thread to prevent UI freezing
            threading.Thread(target=self.query_ollama_bg, args=(metrics,), daemon=True).start()

    def has_state_changed(self, current: Dict[str, Any]) -> bool:
        if not self.last_reported_state:
            return True
        keys = ["face_present", "phone", "eyes_closed", "yawning", "looking_away", "other_person"]
        return any(current.get(k) != self.last_reported_state.get(k) for k in keys)

    def query_ollama_bg(self, metrics: Dict[str, Any]):
        """Queries local Ollama on a secondary thread, updating bubble text & playing chime."""
        decision = self.llm_client.analyze_student_state(metrics)
        msg = decision.get("message", "Keep going, Naveen!")
        
        # Safely update GUI elements from thread
        QTimer.singleShot(0, lambda: self.bubble_label.setText(f"Airi: {msg}"))

        # Broadcast telemetry & decision data to local FastAPI server
        self.send_to_server_hub(metrics, decision)

        # Check if intervention triggers alerts
        if not decision.get("ignore", True):
            self.alerter.trigger_alert(msg, force_alert=decision.get("alert", False))

    def send_to_server_hub(self, metrics: Dict[str, Any], decision: Dict[str, Any]):
        """Transmits state via WebSocket to the central FastAPI hub."""
        if self.ws and self.ws.sock and self.ws.sock.connected:
            try:
                payload = {
                    "type": "telemetry_sync",
                    "metrics": metrics,
                    "decision": decision
                }
                self.ws.send(json.dumps(payload))
            except Exception:
                pass

    def connect_local_backend(self):
        """Maintains automatic reconnection WebSocket link to local FastAPI server."""
        if not websocket:
            return

        while True:
            try:
                print(f"[WS Client] Connecting to Local server: {config.BACKEND_WS_URL}")
                self.ws = websocket.WebSocketApp(
                    config.BACKEND_WS_URL,
                    on_open=lambda ws: print("[WS Client] Connected to Airi FastAPI server!"),
                    on_error=lambda ws, err: None,
                    on_close=lambda ws, code, msg: print("[WS Client] Disconnected.")
                )
                self.ws.run_forever()
            except Exception:
                pass
            time.sleep(5)  # Reconnection interval

    def closeEvent(self, event):
        self.cap.release()
        super().closeEvent(event)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    widget = AiriDesktopWidget()
    sys.exit(app.exec())
