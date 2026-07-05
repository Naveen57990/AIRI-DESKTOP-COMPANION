import React, { useEffect, useRef, useState } from "react";
import { Emotion } from "../types";

interface AiriCharacterProps {
  emotion: Emotion;
  isSpeaking: boolean;
}

export default function AiriCharacter({ emotion, isSpeaking }: AiriCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 }); // Normalized 0-1
  const [blinkState, setBlinkState] = useState(0); // 0 = open, 1 = closed
  const animationFrameRef = useRef<number | null>(null);

  // Gaze Tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      setMousePos({
        x: e.clientX / innerWidth,
        y: e.clientY / innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking loop
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(1); // Close
      setTimeout(() => setBlinkState(0), 150); // Open after 150ms
    }, 4000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Particles ref for emotions
  const particlesRef = useRef<{ id: number; x: number; y: number; vy: number; vx: number; char: string; size: number; alpha: number; life: number }[]>([]);
  const nextParticleId = useRef(0);

  useEffect(() => {
    const particleInterval = setInterval(() => {
      let char = "";
      if (emotion === "excited") char = "⭐";
      else if (emotion === "happy") char = "💖";
      else if (emotion === "sleepy") char = "💤";
      else if (emotion === "sleeping") char = "💤";
      else if (emotion === "thinking") char = "❓";
      else if (emotion === "embarrassed") char = "💦";
      else if (emotion === "angry") char = "💢";
      else if (emotion === "sad") char = "💧";
      else if (emotion === "distracted") char = "🎮";

      if (char) {
        particlesRef.current.push({
          id: nextParticleId.current++,
          x: 80 + Math.random() * 90,
          y: 80 + Math.random() * 50,
          vy: -0.5 - Math.random() * 1.5,
          vx: -0.8 + Math.random() * 1.6,
          char,
          size: 14 + Math.random() * 12,
          alpha: 1.0,
          life: 1.0, // 0 to 1
        });
      }
    }, 450);

    return () => clearInterval(particleInterval);
  }, [emotion]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.04;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sway offset using sin wave for breathing idle animation
      const swayY = Math.sin(time) * 2;
      const swayX = Math.cos(time * 0.5) * 1.2;
      const hairWave = Math.sin(time * 1.5) * 2.5;

      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.beginPath();
      ctx.ellipse(125, 220, 45, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gaze directions (offset in px)
      const gazeX = (mousePos.x - 0.5) * 12;
      const gazeY = (mousePos.y - 0.5) * 8;

      // Neck
      ctx.fillStyle = "#fdddc9";
      ctx.beginPath();
      ctx.moveTo(110, 150 + swayY);
      ctx.lineTo(140, 150 + swayY);
      ctx.lineTo(135, 175 + swayY);
      ctx.lineTo(115, 175 + swayY);
      ctx.closePath();
      ctx.fill();

      // Neck shadow
      ctx.fillStyle = "#f0c6b1";
      ctx.beginPath();
      ctx.moveTo(110, 150 + swayY);
      ctx.lineTo(140, 150 + swayY);
      ctx.lineTo(135, 158 + swayY);
      ctx.lineTo(115, 158 + swayY);
      ctx.closePath();
      ctx.fill();

      // Neck ribbon (Airi's Uniform Ribbon)
      ctx.fillStyle = "#c53030"; // Dark red ribbon
      ctx.beginPath();
      ctx.moveTo(115, 172 + swayY);
      ctx.lineTo(135, 172 + swayY);
      ctx.lineTo(145, 188 + swayY);
      ctx.lineTo(125, 180 + swayY);
      ctx.lineTo(105, 188 + swayY);
      ctx.closePath();
      ctx.fill();

      // Ribbon center knot
      ctx.fillStyle = "#f6ad55"; // Golden knot
      ctx.beginPath();
      ctx.arc(125, 173 + swayY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Face skin base
      ctx.fillStyle = "#ffebe0"; // Soft pale anime skin
      ctx.beginPath();
      ctx.arc(125 + swayX, 110 + swayY, 48, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks Blush
      let blushAlpha = 0.08;
      if (emotion === "embarrassed" || emotion === "excited") blushAlpha = 0.35;
      else if (emotion === "happy") blushAlpha = 0.22;
      else if (emotion === "studying") blushAlpha = 0.12;
      else if (emotion === "sleeping") blushAlpha = 0.15;

      ctx.fillStyle = `rgba(255, 107, 129, ${blushAlpha})`;
      ctx.beginPath();
      ctx.ellipse(96 + swayX, 120 + swayY, 12, 6, Math.PI / 12, 0, Math.PI * 2);
      ctx.ellipse(154 + swayX, 120 + swayY, 12, 6, -Math.PI / 12, 0, Math.PI * 2);
      ctx.fill();

      // Nose
      ctx.strokeStyle = "#e2a991";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(125 + swayX, 112 + swayY);
      ctx.lineTo(124 + swayX, 116 + swayY);
      ctx.stroke();

      // --- Eyes Drawing ---
      const drawEye = (centerX: number, isLeft: boolean) => {
        const eyeOffset = isLeft ? -25 : 25;
        const eX = centerX + eyeOffset + swayX;
        const eY = 104 + swayY;
        const pupilX = eX + gazeX * 0.45;
        const pupilY = eY + gazeY * 0.45;

        // Brows
        ctx.strokeStyle = "#5a3a22"; // Warm hair matches brow color
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let browAng = 0;
        if (emotion === "angry") {
          browAng = isLeft ? 0.25 : -0.25;
        } else if (emotion === "sad" || emotion === "embarrassed") {
          browAng = isLeft ? -0.15 : 0.15;
        } else if (emotion === "surprised") {
          browAng = isLeft ? -0.05 : 0.05;
        }
        ctx.ellipse(eX, eY - 22, 16, 4, browAng, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Blink or closed states
        if (
          blinkState === 1 ||
          (emotion as string) === "sleeping" ||
          (emotion as string) === "sleepy" ||
          (emotion === "happy" && Math.sin(time * 2) > 0.3)
        ) {
          // Closed smiling eyes ^-^
          ctx.strokeStyle = "#1a0f08";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          if (emotion === "sad") {
            // Downward curves
            ctx.ellipse(eX, eY, 14, 8, 0, 0, Math.PI, true);
          } else {
            // Upward happy curves
            ctx.ellipse(eX, eY, 14, 8, 0, Math.PI, 0, false);
          }
          ctx.stroke();
          return;
        }

        // Surprised / widened eyes
        let eyeRadW = 12;
        let eyeRadH = 15;
        if (emotion === "surprised") {
          eyeRadW = 14;
          eyeRadH = 17;
        } else if (emotion === "sleepy" || emotion === "sad") {
          eyeRadH = 10; // Half closed
        }

        // Eye White
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(eX, eY, eyeRadW, eyeRadH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1a0f08";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Iris
        let irisColor = "#ff7979"; // Cute Pink/Purple Iris base
        if (emotion === "angry") irisColor = "#ff4757";
        else if (emotion === "studying") irisColor = "#374151"; // Charcoal smart focus
        else if (emotion === "excited") irisColor = "#feca57"; // Golden excited

        ctx.fillStyle = irisColor;
        ctx.beginPath();
        ctx.ellipse(pupilX, pupilY, eyeRadW - 3, eyeRadH - 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = "#1a0f08";
        ctx.beginPath();
        ctx.ellipse(pupilX, pupilY, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlights (Anime glints)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(pupilX - 3, pupilY - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        if (emotion === "excited" || emotion === "happy") {
          ctx.beginPath();
          ctx.arc(pupilX + 3, pupilY + 3, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      drawEye(125, true);
      drawEye(125, false);

      // --- Mouth Drawing ---
      const mX = 125 + swayX;
      const mY = 132 + swayY;
      ctx.fillStyle = "#f08080";
      ctx.strokeStyle = "#1a0f08";
      ctx.lineWidth = 2.5;

      if (isSpeaking) {
        // Dynamic speaking height using sine
        const mouthHeight = 4 + Math.abs(Math.sin(time * 6.5)) * 11;
        ctx.beginPath();
        ctx.ellipse(mX, mY, 7, mouthHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Static mouth based on emotion
        ctx.beginPath();
        switch (emotion) {
          case "happy":
          case "excited":
            // Big open smile
            ctx.ellipse(mX, mY + 2, 10, 6, 0, 0, Math.PI, false);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
          case "sad":
          case "angry":
            // Frown
            ctx.beginPath();
            ctx.arc(mX, mY + 7, 8, Math.PI, 0, false);
            ctx.stroke();
            break;
          case "sleepy":
          case "sleeping":
            // Small sleepy 'o' mouth
            ctx.ellipse(mX, mY, 3, 3, 0, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case "surprised":
            // Big open 'O' shocked mouth
            ctx.ellipse(mX, mY + 3, 8, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
          case "embarrassed":
          case "thinking":
            // Cute straight line smile or zig-zag
            ctx.moveTo(mX - 6, mY);
            ctx.lineTo(mX + 6, mY);
            ctx.stroke();
            break;
          case "distracted":
            // Cat-like smile :3
            ctx.beginPath();
            ctx.arc(mX - 3, mY, 4, 0, Math.PI, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(mX + 3, mY, 4, 0, Math.PI, false);
            ctx.stroke();
            break;
          default:
            // Cute tiny default curved line smile
            ctx.beginPath();
            ctx.arc(mX, mY - 3, 6, 0.1 * Math.PI, 0.9 * Math.PI, false);
            ctx.stroke();
            break;
        }
      }

      // --- Hair Back ---
      // Warm chestnut brown hair
      const hairColor = "#5a3a22";
      const hairColorDark = "#422815";

      // --- Front bangs & Side strands (Over the face) ---
      ctx.fillStyle = hairColor;

      // Left bang
      ctx.beginPath();
      ctx.moveTo(74 + swayX, 100 + swayY);
      ctx.quadraticCurveTo(80 + swayX, 50 + swayY, 125 + swayX, 60 + swayY);
      ctx.quadraticCurveTo(90 + swayX, 85 + swayY, 82 + swayX + hairWave * 0.5, 128 + swayY);
      ctx.closePath();
      ctx.fill();

      // Right bang
      ctx.beginPath();
      ctx.moveTo(176 + swayX, 100 + swayY);
      ctx.quadraticCurveTo(170 + swayX, 50 + swayY, 125 + swayX, 60 + swayY);
      ctx.quadraticCurveTo(160 + swayX, 85 + swayY, 168 + swayX - hairWave * 0.5, 128 + swayY);
      ctx.closePath();
      ctx.fill();

      // Center bang (forehead split)
      ctx.beginPath();
      ctx.moveTo(115 + swayX, 62 + swayY);
      ctx.lineTo(135 + swayX, 62 + swayY);
      ctx.lineTo(125 + swayX, 96 + swayY);
      ctx.closePath();
      ctx.fill();

      // Side hair lock Left
      ctx.beginPath();
      ctx.moveTo(85 + swayX, 90 + swayY);
      ctx.quadraticCurveTo(60 + swayX, 120 + swayY, 68 + swayX + hairWave, 175 + swayY);
      ctx.quadraticCurveTo(78 + swayX, 140 + swayY, 85 + swayX, 110 + swayY);
      ctx.closePath();
      ctx.fill();

      // Side hair lock Right
      ctx.beginPath();
      ctx.moveTo(165 + swayX, 90 + swayY);
      ctx.quadraticCurveTo(190 + swayX, 120 + swayY, 182 + swayX - hairWave, 175 + swayY);
      ctx.quadraticCurveTo(172 + swayX, 140 + swayY, 165 + swayX, 110 + swayY);
      ctx.closePath();
      ctx.fill();

      // Hair Ribbons / Hairpins (Airi's yellow hair pins)
      ctx.fillStyle = "#f6ad55"; // Golden pin
      ctx.fillRect(84 + swayX, 78 + swayY, 12, 4);
      ctx.fillRect(154 + swayX, 78 + swayY, 12, 4);

      // --- Body Coat / Sailor Uniform ---
      ctx.fillStyle = "#2d3748"; // Dark navy sailor coat
      ctx.beginPath();
      ctx.moveTo(85, 180 + swayY);
      ctx.lineTo(165, 180 + swayY);
      ctx.lineTo(185, 230 + swayY);
      ctx.lineTo(65, 230 + swayY);
      ctx.closePath();
      ctx.fill();

      // Collar trim
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(95, 180 + swayY);
      ctx.lineTo(155, 180 + swayY);
      ctx.lineTo(125, 205 + swayY);
      ctx.closePath();
      ctx.fill();

      // Inner tie/shirt opening
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(115, 180 + swayY);
      ctx.lineTo(135, 180 + swayY);
      ctx.lineTo(125, 192 + swayY);
      ctx.closePath();
      ctx.fill();

      // Sailor Collar flap on back shoulders
      ctx.fillStyle = "#1a202c";
      ctx.fillRect(72, 190 + swayY, 20, 25);
      ctx.fillRect(158, 190 + swayY, 20, 25);

      // --- Draw Particles ---
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.font = `${p.size}px Arial`;
        ctx.fillText(p.char, p.x, p.y);
        ctx.restore();
      });

      // Update particles
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          y: p.y + p.vy,
          x: p.x + p.vx,
          alpha: p.alpha - 0.015,
          life: p.life - 0.015,
        }))
        .filter((p) => p.life > 0 && p.alpha > 0);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mousePos, blinkState, emotion, isSpeaking]);

  return (
    <div className="relative flex flex-col items-center justify-center bg-transparent select-none">
      {/* Visual background indicator aura depending on emotions */}
      <div
        className={`absolute h-44 w-44 rounded-full blur-3xl transition-colors duration-700 ease-in-out opacity-25 ${
          emotion === "happy" || emotion === "excited"
            ? "bg-brand-pink"
            : emotion === "angry"
            ? "bg-red-500"
            : emotion === "sleeping" || emotion === "sleepy"
            ? "bg-brand-violet"
            : emotion === "studying"
            ? "bg-brand-cyan"
            : emotion === "distracted"
            ? "bg-yellow-400"
            : "bg-brand-pink"
        }`}
      />

      <canvas
        ref={canvasRef}
        width={250}
        height={240}
        className="relative z-10 h-[240px] w-[250px] drop-shadow-xl"
        id="airi-live-avatar"
      />
    </div>
  );
}
