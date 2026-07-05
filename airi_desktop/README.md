# Airi Local Guardian — Offline Vision & AI Suite

Welcome to the ultimate private study environment for your MacBook! 

This folder contains a fully re-engineered, local-first companion architecture. **Zero raw images or webcam frames ever leave your computer or touch the cloud.** All computer vision tracking is computed 100% locally on your machine using OpenCV and Google MediaPipe. 

The tracking coordinates are converted into a lightweight, private JSON status structure, and only this structured text is sent to your local Ollama LLM (`gemma2` or `llama3`) to construct cheerful, encouraging anime messages!

---

## 🏗️ Architecture Design & Modules

1. **`config.py`**: A central configuration file holding EAR/MAR thresholds, camera parameters, and local directories.
2. **`vision_detector.py`**: The local eyes of Airi. Computes Eye Aspect Ratio (EAR) for sleepiness, Mouth Aspect Ratio (MAR) for yawning, facial landmark symmetry for looking away, and face presence using **MediaPipe Face Mesh**. Uses an auto-downloading, ultra-fast **YOLOv4-tiny DNN** to detect cell phones and other people. Tracks cumulative `study_time` and `distraction_duration` in seconds.
3. **`llm_client.py`**: The local brain. Formulates JSON telemetry state vectors and queries your local Ollama model to generate cute anime responses from Airi without sharing any imagery. Falls back to a local, offline rule-engine if Ollama is offline!
4. **`alert_manager.py`**: The alarm bell. Triggers native macOS system chimes (`afplay`) and speaks messages using macOS's built-in vocalizer (`say`) under safe, smart alert-fatigue cooldown periods.
5. **`airi_desktop.py`**: A unified, cross-platform CLI console application. Displays camera telemetry overlay HUD and prints out local metrics in real-time.
6. **`airi_server.py`**: The communication hub. Starts a local FastAPI server to bridge your desktop tracking status with your web browser in real-time.
7. **`airi_client.py`**: The floating desktop overlay window! Renders an interactive anime mascot on your desktop with a transparent background, click-through overlay, and voice support.

---

## 🚀 Setting up on your MacBook

### Prereqs
Make sure you have **Python 3.10+** installed on your macOS. Open a Terminal and run:

```bash
python3 --version
```

### 1. Extract and Install Dependencies
Navigate into the `airi_desktop` directory on your laptop, create a virtual environment, and install the local packages:

```bash
# Move to the folder where you placed these files
cd airi_desktop

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 2. Turn on local Ollama
Ensure you have **Ollama** running locally. Pull your favorite model:

```bash
ollama run gemma2
```
*(You can customize the model name or Ollama URL in `config.py`!)*

### 3. Launch Airi Desktop Companion!
For the **complete interactive floating desktop experience**:

1. **Start the local FastAPI hub** in your terminal:
   ```bash
   python airi_server.py
   ```
2. **Launch the floating anime girl desktop widget** in a separate tab or window:
   ```bash
   python airi_client.py
   ```

*(Alternatively, if you only want the HUD terminal tracking console, you can run: `python airi_desktop.py`)*

Enjoy studying securely with Airi, Naveen! 🌸
