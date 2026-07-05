# airi_desktop/vision_detector.py
import cv2
import numpy as np
import urllib.request
import time
import sys
from pathlib import Path
from typing import Dict, Any, Tuple

# Import local config
import config

# Try importing MediaPipe, print warning if missing
try:
    import mediapipe as mp
except ImportError:
    print("Warning: 'mediapipe' library not found. Please run: pip install mediapipe")
    mp = None


class LocalVisionDetector:
    def __init__(self):
        self.face_present = False
        self.eyes_closed = False
        self.yawning = False
        self.looking_away = False
        self.phone_detected = False
        self.other_person_detected = False
        
        # Posture/landmark consecutive counters for stability
        self.drowsy_counter = 0
        self.yawn_counter = 0
        self.look_away_counter = 0

        # Session metrics
        self.start_time = time.time()
        self.last_check_time = time.time()
        self.study_time_accum = 0.0
        self.distraction_duration_accum = 0.0

        # Initialize Models
        self._init_yolo()
        self._init_mediapipe()

    def _init_yolo(self):
        """Prepares and loads YOLOv4-tiny model for free, local object detection."""
        cfg_path = config.YOLO_CFG_PATH
        weights_path = config.YOLO_WEIGHTS_PATH

        # Auto-download models if they are missing
        if not cfg_path.exists() or not weights_path.exists():
            print("--------------------------------------------------")
            print("Airi local brain: Local YOLO model files are missing.")
            print("Downloading lightweight YOLOv4-tiny model (~23MB)...")
            print("This runs 100% locally on your CPU/GPU, no data ever leaves your computer!")
            print("--------------------------------------------------")
            
            try:
                if not cfg_path.exists():
                    print(f"Downloading: {config.YOLO_CFG_URL}")
                    urllib.request.urlretrieve(config.YOLO_CFG_URL, cfg_path)
                if not weights_path.exists():
                    print(f"Downloading: {config.YOLO_WEIGHTS_URL}")
                    urllib.request.urlretrieve(config.YOLO_WEIGHTS_URL, weights_path)
                print("Download complete! Model loaded successfully.")
            except Exception as e:
                print(f"Critical Error: Failed to auto-download local model files. {e}", file=sys.stderr)
                print("Airi will fall back to landmark-only analysis.", file=sys.stderr)
                self.net = None
                return

        try:
            self.net = cv2.dnn.readNetFromDarknet(str(cfg_path), str(weights_path))
            self.net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
            self.net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
            
            # YOLO COCO dataset classes we care about
            # Class 0 = Person, Class 67 = Cell Phone
            self.classes_of_interest = {0: "person", 67: "cell phone"}
        except Exception as e:
            print(f"Error initializing YOLO DNN: {e}", file=sys.stderr)
            self.net = None

    def _init_mediapipe(self):
        """Initializes MediaPipe Face Mesh."""
        if mp is None:
            self.mp_face_mesh = None
            return

        self.mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=2,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def calculate_ear(self, landmarks, eye_indices, width, height) -> float:
        """Computes the Eye Aspect Ratio (EAR) for drowsiness estimation."""
        try:
            # eye_indices consists of 6 landmark points in clockwise order:
            # p1 (outer corner), p2 (upper lid 1), p3 (upper lid 2), p4 (inner corner), p5 (lower lid 1), p6 (lower lid 2)
            pts = []
            for idx in eye_indices:
                lm = landmarks[idx]
                pts.append(np.array([lm.x * width, lm.y * height]))

            # Distances between vertical eye landmarks
            v1 = np.linalg.norm(pts[1] - pts[5])
            v2 = np.linalg.norm(pts[2] - pts[4])
            # Distance between horizontal eye landmarks
            h = np.linalg.norm(pts[0] - pts[3])

            ear = (v1 + v2) / (2.0 * h) if h > 0 else 0.0
            return ear
        except Exception:
            return 0.3  # Graceful neutral fallback

    def calculate_mar(self, landmarks, mouth_indices, width, height) -> float:
        """Computes Mouth Aspect Ratio (MAR) to detect yawning."""
        try:
            pts = []
            for idx in mouth_indices:
                lm = landmarks[idx]
                pts.append(np.array([lm.x * width, lm.y * height]))

            # Horizontal distance between mouth corners (78 to 308)
            h = np.linalg.norm(pts[0] - pts[4])
            # Vertical distances of inner lip centers
            v1 = np.linalg.norm(pts[2] - pts[6])  # 13 to 14
            v2 = np.linalg.norm(pts[1] - pts[5])  # 81 to 402
            v3 = np.linalg.norm(pts[3] - pts[7])  # 311 to 178

            mar = (v1 + v2 + v3) / (3.0 * h) if h > 0 else 0.0
            return mar
        except Exception:
            return 0.0

    def check_looking_away(self, landmarks) -> Tuple[bool, float]:
        """Estimates if the head is turned away using facial landmark horizontal ratios."""
        try:
            # Nose tip landmark: 1
            # Face left-most edge: 234, Right-most edge: 454
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
        """
        Processes a single camera frame locally using MediaPipe + OpenCV DNN.
        Returns a highly structured JSON report on distraction indicators.
        """
        if frame is None:
            return self.get_empty_state()

        height, width, _ = frame.shape
        self.face_present = False
        
        # 1. LANDMARK-BASED LANDSCAPE (MediaPipe Face Mesh)
        if self.mp_face_mesh:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.mp_face_mesh.process(rgb_frame)

            if results.multi_face_landmarks:
                self.face_present = True
                landmarks = results.multi_face_landmarks[0].landmark
                
                # Eye landmarks
                right_eye_indices = [33, 160, 158, 133, 153, 144]
                left_eye_indices = [362, 385, 387, 263, 373, 380]
                ear_r = self.calculate_ear(landmarks, right_eye_indices, width, height)
                ear_l = self.calculate_ear(landmarks, left_eye_indices, width, height)
                avg_ear = (ear_r + ear_l) / 2.0

                # Drowsiness check
                if avg_ear < config.EAR_THRESHOLD:
                    self.drowsy_counter += 1
                else:
                    self.drowsy_counter = max(0, self.drowsy_counter - 1)
                self.eyes_closed = (self.drowsy_counter >= config.CONSECUTIVE_FRAMES_DROWSY)

                # Mouth landmarks for yawning
                mouth_indices = [78, 81, 13, 311, 308, 402, 14, 178]
                mar = self.calculate_mar(landmarks, mouth_indices, width, height)
                if mar > config.MAR_THRESHOLD:
                    self.yawn_counter += 1
                else:
                    self.yawn_counter = max(0, self.yawn_counter - 1)
                self.yawning = (self.yawn_counter >= config.CONSECUTIVE_FRAMES_YAWNING)

                # Head Pose check for looking away
                turned, ratio = self.check_looking_away(landmarks)
                if turned:
                    self.look_away_counter += 1
                else:
                    self.look_away_counter = max(0, self.look_away_counter - 1)
                self.looking_away = (self.look_away_counter >= config.CONSECUTIVE_FRAMES_LOOKING_AWAY)

                # If another person's face is detected in the landmark collection
                if len(results.multi_face_landmarks) > 1:
                    self.other_person_detected = True
                else:
                    self.other_person_detected = False

        # 2. LOCAL OBJECT DETECTION (OpenCV YOLO DNN)
        self.phone_detected = False
        if self.net is not None:
            try:
                # Build input blob
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
                            if class_id == 67:  # cell phone
                                self.phone_detected = True
                            elif class_id == 0:  # person
                                person_count += 1

                # If more than 1 person is detected in YOLO, flag other person
                if person_count > 1:
                    self.other_person_detected = True

            except Exception as e:
                print(f"YOLO detection frame exception: {e}", file=sys.stderr)

        # 3. CONVERT METRICS & TRACK STUDY TIME vs DISTRACTION TIME
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
        """Fallback status if webcam frame stream is cut off."""
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
