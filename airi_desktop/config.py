# airi_desktop/config.py
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
# Left/Right symmetry threshold. A value closer to 1 means centered.
# If symmetry is less than 0.6 or greater than 1.6, the user is looking away.
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
