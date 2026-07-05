import React, { useState } from "react";
import { Download, FileCode, CheckCircle, Copy, Terminal, Server, ChevronRight, BookOpen } from "lucide-react";

export default function CodebaseDownloader() {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "config" | "detector" | "llm" | "alerter" | "client" | "server" | "requirements" | "readme"
  >("config");

  const files = {
    config: {
      name: "config.py",
      lang: "python",
      code: `# config.py
import os
from pathlib import Path

# Base Paths
USER_HOME = Path.home()
AIRI_DIR = USER_HOME / ".airi"
AIRI_DIR.mkdir(exist_ok=True)

MODEL_DIR = AIRI_DIR / "models"
MODEL_DIR.mkdir(exist_ok=True)

# AI Engine / Ollama Configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma2")

# Webcam Configuration
WEBCAM_INDEX = 0  # Default webcam
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
TRACKING_INTERVAL_SEC = 5.0  # Run full state analysis every 5 seconds

# Drowsiness (Eye Aspect Ratio) Parameters
EAR_THRESHOLD = 0.21
CONSECUTIVE_FRAMES_DROWSY = 4  # Number of checks before flagging sleepy

# Yawning (Mouth Aspect Ratio) Parameters
MAR_THRESHOLD = 0.58
CONSECUTIVE_FRAMES_YAWNING = 3

# Head Pose / Looking Away Parameters
LOOKING_AWAY_MIN_RATIO = 0.65
LOOKING_AWAY_MAX_RATIO = 1.55
CONSECUTIVE_FRAMES_LOOKING_AWAY = 4

# Object Detection Models (YOLOv4-tiny COCO)
YOLO_CFG_URL = "https://raw.githubusercontent.com/AlexeyAB/darknet/master/cfg/yolov4-tiny.cfg"
YOLO_WEIGHTS_URL = "https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v4_pre/yolov4-tiny.weights"

YOLO_CFG_PATH = MODEL_DIR / "yolov4-tiny.cfg"
YOLO_WEIGHTS_PATH = MODEL_DIR / "yolov4-tiny.weights"

# Alert Configuration
ALERT_COOLDOWN_SEC = 15.0  # Avoid spamming alerts
ALERT_VOICE = "Samantha"   # macOS Samantha, or general tts voice
ALERT_SOUND_PATH = "/System/Library/Sounds/Glass.aiff"  # Native macOS chime

# Companion WebSocket Configuration
BACKEND_WS_URL = "ws://localhost:8000/ws"
BACKEND_HTTP_URL = "http://localhost:8000"
`,
    },
    detector: {
      name: "vision_detector.py",
      lang: "python",
      code: `# vision_detector.py
import cv2
import numpy as np
import urllib.request
import time
import sys
from pathlib import Path
from typing import Dict, Any, Tuple

import config

try:
    import mediapipe as mp
except ImportError:
    mp = None

class LocalVisionDetector:
    def __init__(self):
        self.face_present = False
        self.eyes_closed = False
        self.yawning = False
        self.looking_away = False
        self.phone_detected = False
        self.other_person_detected = False
        
        self.drowsy_counter = 0
        self.yawn_counter = 0
        self.look_away_counter = 0

        self.start_time = time.time()
        self.last_check_time = time.time()
        self.study_time_accum = 0.0
        self.distraction_duration_accum = 0.0

        self._init_yolo()
        self._init_mediapipe()

    def _init_yolo(self):
        cfg_path = config.YOLO_CFG_PATH
        weights_path = config.YOLO_WEIGHTS_PATH

        if not cfg_path.exists() or not weights_path.exists():
            try:
                if not cfg_path.exists():
                    urllib.request.urlretrieve(config.YOLO_CFG_URL, cfg_path)
                if not weights_path.exists():
                    urllib.request.urlretrieve(config.YOLO_WEIGHTS_URL, weights_path)
            except Exception as e:
                self.net = None
                return

        try:
            self.net = cv2.dnn.readNetFromDarknet(str(cfg_path), str(weights_path))
            self.net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
            self.net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
            self.classes_of_interest = {0: "person", 67: "cell phone"}
        except Exception:
            self.net = None

    def _init_mediapipe(self):
        if mp is None:
            return
        self.mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=2,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def calculate_ear(self, landmarks, eye_indices, width, height) -> float:
        try:
            pts = []
            for idx in eye_indices:
                lm = landmarks[idx]
                pts.append(np.array([lm.x * width, lm.y * height]))
            v1 = np.linalg.norm(pts[1] - pts[5])
            v2 = np.linalg.norm(pts[2] - pts[4])
            h = np.linalg.norm(pts[0] - pts[3])
            return (v1 + v2) / (2.0 * h) if h > 0 else 0.0
        except Exception:
            return 0.3

    def calculate_mar(self, landmarks, mouth_indices, width, height) -> float:
        try:
            pts = []
            for idx in mouth_indices:
                lm = landmarks[idx]
                pts.append(np.array([lm.x * width, lm.y * height]))
            h = np.linalg.norm(pts[0] - pts[4])
            v1 = np.linalg.norm(pts[2] - pts[6])
            v2 = np.linalg.norm(pts[1] - pts[4])
            v3 = np.linalg.norm(pts[3] - pts[7])
            return (v1 + v2 + v3) / (3.0 * h) if h > 0 else 0.0
        except Exception:
            return 0.0

    def check_looking_away(self, landmarks) -> Tuple[bool, float]:
        try:
            nose_x = landmarks[1].x
            left_x = landmarks[234].x
            right_x = landmarks[454].x
            left_dist = abs(nose_x - left_x)
            right_dist = abs(right_x - nose_x)
            ratio = left_dist / right_dist if right_dist > 0 else 1.0
            is_turned = (ratio < config.LOOKING_AWAY_MIN_RATIO) or (ratio > config.LOOKING_AWAY_MAX_RATIO)
            return is_turned, ratio
        except Exception:
            return False, 1.0

    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        if frame is None:
            return self.get_empty_state()
        height, width, _ = frame.shape
        self.face_present = False
        
        if self.mp_face_mesh:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.mp_face_mesh.process(rgb_frame)
            if results.multi_face_landmarks:
                self.face_present = True
                landmarks = results.multi_face_landmarks[0].landmark
                
                right_eye_indices = [33, 160, 158, 133, 153, 144]
                left_eye_indices = [362, 385, 387, 263, 373, 380]
                ear_r = self.calculate_ear(landmarks, right_eye_indices, width, height)
                ear_l = self.calculate_ear(landmarks, left_eye_indices, width, height)
                avg_ear = (ear_r + ear_l) / 2.0

                if avg_ear < config.EAR_THRESHOLD:
                    self.drowsy_counter += 1
                else:
                    self.drowsy_counter = max(0, self.drowsy_counter - 1)
                self.eyes_closed = (self.drowsy_counter >= config.CONSECUTIVE_FRAMES_DROWSY)

                mouth_indices = [78, 81, 13, 311, 308, 402, 14, 178]
                mar = self.calculate_mar(landmarks, mouth_indices, width, height)
                if mar > config.MAR_THRESHOLD:
                    self.yawn_counter += 1
                else:
                    self.yawn_counter = max(0, self.yawn_counter - 1)
                self.yawning = (self.yawn_counter >= config.CONSECUTIVE_FRAMES_YAWNING)

                turned, ratio = self.check_looking_away(landmarks)
                if turned:
                    self.look_away_counter += 1
                else:
                    self.look_away_counter = max(0, self.look_away_counter - 1)
                self.looking_away = (self.look_away_counter >= config.CONSECUTIVE_FRAMES_LOOKING_AWAY)

                self.other_person_detected = len(results.multi_face_landmarks) > 1

        self.phone_detected = False
        if self.net is not None:
            try:
                blob = cv2.dnn.blobFromImage(frame, 1/255.0, (416, 416), swapRB=True, crop=False)
                self.net.setInput(blob)
                layer_names = self.net.getLayerNames()
                output_layers = [layer_names[i - 1] for i in self.net.getUnconnectedOutLayers()]
                outputs = self.net.forward(output_layers)
                conf_threshold = 0.35
                person_count = 0
                for output in outputs:
                    for detection in output:
                        scores = detection[5:]
                        class_id = np.argmax(scores)
                        confidence = scores[class_id]
                        if confidence > conf_threshold:
                            if class_id == 67:
                                self.phone_detected = True
                            elif class_id == 0:
                                person_count += 1
                if person_count > 1:
                    self.other_person_detected = True
            except Exception:
                pass

        now = time.time()
        elapsed = now - self.last_check_time
        self.last_check_time = now

        is_distracted = (
            not self.face_present or 
            self.phone_detected or 
            self.eyes_closed or 
            self.looking_away or 
            self.other_person_detected
        )

        if is_distracted:
            self.distraction_duration_accum += elapsed
        else:
            self.study_time_accum += elapsed

        return {
            "face_present": self.face_present,
            "phone": self.phone_detected,
            "yawning": self.yawning,
            "eyes_closed": self.eyes_closed,
            "looking_away": self.looking_away,
            "other_person": self.other_person_detected,
            "study_time": int(self.study_time_accum),
            "distraction_duration": int(self.distraction_duration_accum)
        }

    def get_empty_state(self) -> Dict[str, Any]:
        return {
            "face_present": False,
            "phone": False,
            "yawning": False,
            "eyes_closed": False,
            "looking_away": False,
            "other_person": False,
            "study_time": int(self.study_time_accum),
            "distraction_duration": int(self.distraction_duration_accum)
        }
`,
    },
    llm: {
      name: "llm_client.py",
      lang: "python",
      code: `# llm_client.py
import json
import urllib.request
import urllib.error
import sys
from typing import Dict, Any

import config

class OllamaLlmClient:
    def __init__(self):
        self.endpoint = f"{config.OLLAMA_URL}/api/generate"
        self.model = config.OLLAMA_MODEL

    def analyze_student_state(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        system_instruction = (
            "You are Airi, Naveen's cheerful anime study companion. "
            "Analyze the posture/activity metrics and determine if Naveen is focused or distracted. "
            "Return a clean JSON object with EXACTLY three fields:\\n"
            '1. "alert": boolean (true if he is severely distracted or absent and needs a sound chime)\\n'
            '2. "message": string (a very short, lively anime comment under 15 words.)\\n'
            '3. "ignore": boolean (true if he is focused, so we don\\'t disrupt him)\\n'
            "Respond ONLY with valid JSON."
        )

        prompt = f"{system_instruction}\\n\\nMETRICS:\\n{json.dumps(metrics)}\\n\\nDECISION:"
        payload = {"model": self.model, "prompt": prompt, "stream": False, "format": "json"}

        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(self.endpoint, data=data, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=8) as response:
                res_data = response.read().decode("utf-8")
                raw_json = json.loads(res_data)
                response_text = raw_json.get("response", "").strip()
                try:
                    return json.loads(response_text)
                except Exception:
                    clean_str = response_text.replace("\`\`\`json", "").replace("\`\`\`", "").strip()
                    return json.loads(clean_str)
        except Exception as e:
            return self._generate_local_rule_decision(metrics, f"Ollama offline: {e}")

    def _generate_local_rule_decision(self, metrics: Dict[str, Any], reason: str) -> Dict[str, Any]:
        is_distracted = False
        message = "You are doing amazing, Naveen! Keep up the focus!"
        alert = False
        ignore = True

        if not metrics.get("face_present", False):
            is_distracted = True
            message = "Naveen, where did you go? Airi is waiting!"
            alert = True
            ignore = False
        elif metrics.get("phone", False):
            is_distracted = True
            message = "Hey! No phone allowed during focus time, Naveen!"
            alert = True
            ignore = False
        elif metrics.get("eyes_closed", False):
            is_distracted = True
            message = "Naveen, sleepy? Stretch a bit and drink water!"
            alert = True
            ignore = False

        return {"alert": alert, "message": f"[Failsafe] {message}", "ignore": ignore}
`,
    },
    alerter: {
      name: "alert_manager.py",
      lang: "python",
      code: `# alert_manager.py
import os
import time
import sys
import subprocess

import config

class AlertManager:
    def __init__(self):
        self.last_alert_time = 0.0
        self.cooldown = config.ALERT_COOLDOWN_SEC
        self.voice = config.ALERT_VOICE
        self.sound_path = config.ALERT_SOUND_PATH

    def trigger_alert(self, message: str, force_alert: bool = False):
        now = time.time()
        if force_alert or (now - self.last_alert_time >= self.cooldown):
            self.last_alert_time = now
            self.play_chime()
            self.speak(message)

    def play_chime(self):
        try:
            if sys.platform == "darwin" and os.path.exists(self.sound_path):
                subprocess.Popen(["afplay", self.sound_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            elif sys.platform == "win32":
                import winsound
                winsound.Beep(1000, 300)
            else:
                sys.stdout.write("\\a")
                sys.stdout.flush()
        except Exception:
            pass

    def speak(self, text: str):
        try:
            if sys.platform == "darwin":
                safe_text = text.replace("'", "").replace('"', "")
                subprocess.Popen(["say", "-v", self.voice, safe_text], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
`,
    },
    client: {
      name: "airi_client.py",
      lang: "python",
      code: `# airi_client.py
import sys
import cv2
import json
import time
import threading
from typing import Dict, Any

from PySide6.QtCore import Qt, QTimer, Slot, QPoint
from PySide6.QtWidgets import QApplication, QMainWindow, QLabel, QVBoxLayout, QWidget

import config
from vision_detector import LocalVisionDetector
from llm_client import OllamaLlmClient
from alert_manager import AlertManager

class AiriDesktopWidget(QMainWindow):
    def __init__(self):
        super().__init__()
        self.init_ui()
        self.detector = LocalVisionDetector()
        self.llm_client = OllamaLlmClient()
        self.alerter = AlertManager()

        self.last_reported_state: Dict[str, Any] = {}
        self.last_llm_time = 0.0
        self.llm_interval = 15.0

        self.cap = cv2.VideoCapture(config.WEBCAM_INDEX)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)

        self.timer = QTimer(self)
        self.timer.timeout.connect(self.run_frame_pipeline)
        self.timer.start(33)

    def init_ui(self):
        self.setAttribute(Qt.WA_TranslucentBackground, True)
        self.setAttribute(Qt.WA_NoSystemBackground, True)
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.SubWindow)

        self.central_widget = QWidget(self)
        self.layout = QVBoxLayout(self.central_widget)
        self.bubble_label = QLabel("Airi: Ready!", self.central_widget)
        self.bubble_label.setStyleSheet("background-color: rgba(20,21,23,210); color: #ff7597; border-radius: 12px; padding: 8px; font-size: 11px;")
        self.layout.addWidget(self.bubble_label)

        self.avatar_label = QLabel(self.central_widget)
        self.layout.addWidget(self.avatar_label)
        self.update_avatar("focused")
        self.setCentralWidget(self.central_widget)
        self.show()

    def update_avatar(self, mood: str):
        emojis = {
            "focused": "🌸 (^_^) 🌸\\nAiri: Focusing",
            "phone": "🚫 (ಠ_ಠ) 🚫\\nNo Phones!",
            "sleepy": "💤 (u_u) 💤\\nWake up!",
            "absent": "❓ (o_o) ❓\\nWhere is Naveen?",
        }
        self.avatar_label.setText(emojis.get(mood, "🌸 (^_^) 🌸"))

    def run_frame_pipeline(self):
        ret, frame = self.cap.read()
        if not ret: return
        frame = cv2.flip(frame, 1)
        metrics = self.detector.process_frame(frame)

        if not metrics["face_present"]: self.update_avatar("absent")
        elif metrics["phone"]: self.update_avatar("phone")
        elif metrics["eyes_closed"]: self.update_avatar("sleepy")
        else: self.update_avatar("focused")

        now = time.time()
        if (now - self.last_llm_time >= self.llm_interval):
            self.last_llm_time = now
            threading.Thread(target=self.query_ollama_bg, args=(metrics,), daemon=True).start()

    def query_ollama_bg(self, metrics: Dict[str, Any]):
        decision = self.llm_client.analyze_student_state(metrics)
        msg = decision.get("message", "Keep going!")
        QTimer.singleShot(0, lambda: self.bubble_label.setText(f"Airi: {msg}"))
        if not decision.get("ignore", True):
            self.alerter.trigger_alert(msg, force_alert=decision.get("alert", False))

if __name__ == "__main__":
    app = QApplication(sys.argv)
    widget = AiriDesktopWidget()
    sys.exit(app.exec())
`,
    },
    server: {
      name: "airi_server.py",
      lang: "python",
      code: `# airi_server.py
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Airi Hub")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

active_connections: List[WebSocket] = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast state changes safely to browser
            for conn in active_connections:
                await conn.send_text(data)
    except WebSocketDisconnect:
        active_connections.remove(websocket)
`,
    },
    requirements: {
      name: "requirements.txt",
      lang: "text",
      code: `PySide6>=6.5.0
opencv-python>=4.7.0.72
mediapipe>=0.10.0
fastapi>=0.95.0
uvicorn>=0.22.0
websocket-client>=1.5.0
pydantic>=2.0.0
numpy>=1.24.0
`,
    },
    readme: {
      name: "README.md",
      lang: "markdown",
      code: `# Airi Local Study Guardian

This folder contains the complete modular python codebase for running **Airi** with fully offline, local-only vision tracking!

## Local Requirements
1. **Python 3.10+**
2. **Pip Packages**: install using \`pip install -r requirements.txt\`
3. **Ollama**: running locally on your laptop with \`gemma2\` or \`llama3\`

## Launch Steps
1. Spin up the FastAPI coordinator:
   \`\`\`bash
   python airi_server.py
   \`\`\`
2. In another tab, launch the transparent floating desktop mascot widget:
   \`\`\`bash
   python airi_client.py
   \`\`\`

Airi will track your eyes, yawns, posture, other people, and phone usage locally without uploading any images.
`,
    },
  };

  const handleCopy = (fileName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const triggerDownload = (fileName: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brand-pink/15 border border-brand-pink/30 text-brand-pink rounded-xl">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Native Desktop Source Hub</h3>
            <p className="text-xs text-white/60">Download and run Airi locally on your MacBook client</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            // Download all 8 modular files in sequence
            const keys = Object.keys(files) as Array<keyof typeof files>;
            keys.forEach((key, index) => {
              setTimeout(() => {
                triggerDownload(files[key].name, files[key].code);
              }, index * 250);
            });
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-brand-pink to-brand-violet text-white rounded-xl text-xs font-semibold transition-all shadow-md self-start cursor-pointer hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          <span>Download Python Codebase ZIP</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Files index list */}
        <div className="space-y-1.5 lg:col-span-1">
          <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2 px-2">
            Project Files Tree
          </p>
          {(Object.keys(files) as Array<keyof typeof files>).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                activeTab === key
                  ? "bg-brand-pink/15 border-brand-pink text-brand-pink"
                  : "bg-brand-black border-white/10 text-white/50 hover:bg-white/5 hover:border-white/20"
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <FileCode className="h-4 w-4 text-brand-pink shrink-0" />
                <span className="text-xs font-mono truncate">{files[key].name}</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-white/30 shrink-0" />
            </button>
          ))}
        </div>

        {/* Selected file preview */}
        <div className="lg:col-span-3 flex flex-col bg-brand-black border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10">
            <span className="text-xs font-mono text-white/60">{files[activeTab].name}</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleCopy(files[activeTab].name, files[activeTab].code)}
                className="p-1.5 hover:bg-white/5 text-white/40 hover:text-brand-pink rounded-lg transition-all cursor-pointer"
                title="Copy code"
              >
                {copiedFile === files[activeTab].name ? (
                  <CheckCircle className="h-3.5 w-3.5 text-brand-cyan" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => triggerDownload(files[activeTab].name, files[activeTab].code)}
                className="p-1.5 hover:bg-white/5 text-white/40 hover:text-brand-pink rounded-lg transition-all cursor-pointer"
                title="Download file"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <pre className="p-4 overflow-auto max-h-96 text-xs font-mono text-white/80 leading-relaxed bg-brand-black">
            <code>{files[activeTab].code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
