import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const DEFAULT_AI_PROVIDER = process.env.AI_PROVIDER || "gemini";
const DEFAULT_OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma2";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize Google GenAI SDK
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will run in offline demo mode.");
}

// 1. Chat & Reasoning Endpoint (with Optional Search Grounding)
app.post("/api/chat", async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, systemPrompt, useSearch, aiProvider, ollamaUrl, ollamaModel } = req.body;

    const provider = aiProvider || DEFAULT_AI_PROVIDER;
    const url = ollamaUrl || DEFAULT_OLLAMA_URL;
    const model = ollamaModel || DEFAULT_OLLAMA_MODEL;

    if (provider === "ollama") {
      const ollamaMessages = [
        { role: "system", content: systemPrompt || "You are Airi, a helpful anime-style study companion." },
        ...messages.map((msg: any) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      ];

      const ollamaRes = await fetch(`${url}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          messages: ollamaMessages,
          stream: false,
        }),
      });

      if (!ollamaRes.ok) {
        throw new Error(`Ollama returned status ${ollamaRes.status}`);
      }

      const data: any = await ollamaRes.json();
      const replyText = data.message?.content || "I didn't quite catch that, Naveen. Let me try again!";
      res.json({ text: replyText, sources: [] });
      return;
    }

    if (!ai) {
      res.json({
        text: "Hi Naveen! I'm running in local offline demo mode because the Gemini API key isn't configured in the secrets dashboard. I can still help you study, track your focus, and manage your schedule!",
        sources: [],
      });
      return;
    }

    // Convert message history to standard format
    const contents = messages.map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const config: any = {
      systemInstruction: systemPrompt || "You are Airi, a helpful anime-style study companion.",
      temperature: 0.7,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config,
    });

    const replyText = response.text || "I didn't quite catch that, Naveen. Let me try again!";
    
    // Extract search grounding sources if present
    const sources: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      for (const chunk of chunks) {
        if (chunk.web?.uri) {
          sources.push(`${chunk.web.title || "Source"} (${chunk.web.uri})`);
        }
      }
    }

    res.json({ text: replyText, sources });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during inference." });
  }
});

// 2. PDF & Study Material Document Analyzer Endpoint
app.post("/api/pdf/analyze", async (req: Request, res: Response): Promise<void> => {
  try {
    const { textContent, fileName, aiProvider, ollamaUrl, ollamaModel } = req.body;

    const provider = aiProvider || DEFAULT_AI_PROVIDER;
    const url = ollamaUrl || DEFAULT_OLLAMA_URL;
    const model = ollamaModel || DEFAULT_OLLAMA_MODEL;

    if (provider === "ollama") {
      const systemInstruction = `You are Airi, a helpful anime-style study companion for Naveen. Analyze the provided study material and return a JSON object with:
- "title": a string title of the notes.
- "summary": a conversational, friendly, supportive summary of the notes under 120 words.
- "formulas": a list of math/science formula strings or chemical equations.
- "flashcards": a list of objects containing "id", "question", and "answer". Provide at least 4 flashcards.
Strictly output valid JSON only. Do not wrap in markdown blocks like \`\`\`json.`;

      const prompt = `${systemInstruction}\n\nSTUDY NOTES TO ANALYZE:\nTitle: ${fileName || "Study Material"}\nContent:\n${textContent}`;

      const ollamaRes = await fetch(`${url}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          stream: false,
          format: "json"
        }),
      });

      if (!ollamaRes.ok) {
        throw new Error(`Ollama returned status ${ollamaRes.status}`);
      }

      const rawData: any = await ollamaRes.json();
      let parsedResult;
      try {
        parsedResult = JSON.parse(rawData.response);
      } catch (e) {
        let cleanStr = rawData.response.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedResult = JSON.parse(cleanStr);
      }
      res.json(parsedResult);
      return;
    }

    if (!ai) {
      // Return beautiful simulated flashcards if API key is not configured
      res.json({
        title: fileName || "Study Material",
        summary: "This is a simulated summary of the study material because the server is offline. It details how Airi analyzes complex papers, extracts algebraic formula blocks, and compiles multi-layered interactive flashcards to test memory curves.",
        formulas: ["E = mc²", "a² + b² = c²", "f(x) = ∫[a,b] g(t) dt"],
        flashcards: [
          { id: "1", question: "What is the core theme of this document?", answer: "An overview of active study techniques and cognitive adaptation." },
          { id: "2", question: "How does spacing out study sessions help?", answer: "It leverages the spacing effect, enhancing long-term memory retrieval." },
        ],
      });
      return;
    }

    const prompt = `Analyze this textbook content or study notes:
"${textContent}"

Generate a beautiful summary, a list of critical mathematical/science formulas or chemical equations present, and a list of at least 4 interactive Q&A flashcards for testing memory. Speak as Airi, Naveen's assistant, in the summary.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING, description: "A conversational, friendly summary from Airi." },
            formulas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Formulas or key equations extracted.",
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                },
                required: ["id", "question", "answer"],
              },
            },
          },
          required: ["title", "summary", "formulas", "flashcards"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Document Analyzer Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze document." });
  }
});

// 3. Computer Vision Frame Analyst (Enables real camera triggers to double-check distraction)
app.post("/api/vision/analyze", async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, language, aiProvider, ollamaUrl, ollamaModel } = req.body;

    const provider = aiProvider || DEFAULT_AI_PROVIDER;
    const url = ollamaUrl || DEFAULT_OLLAMA_URL;
    const model = ollamaModel || DEFAULT_OLLAMA_MODEL;

    if (provider === "ollama") {
      // Clean base64 string
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      let promptText = `Analyze this webcam snapshot of a student (Naveen) studying. Check if he is: 1) looking focused at the screen, 2) holding a phone / distracted, 3) yawning / looks sleepy, 4) absent, or 5) there is another person in the room. Output a JSON object ONLY: { "detection": "focused" | "phone" | "sleepy" | "absent" | "other_person", "comment": "cheerful 1-sentence comment from anime companion Airi under 15 words" }. Strictly respond with valid JSON, do not use markdown wraps.`;
      if (language === "te") {
        promptText += " IMPORTANT: Please write the comment entirely in Telugu (తెలుగు) using clean Telugu script. Address Naveen directly in a supportive, lively anime companion style!";
      }

      const ollamaRes = await fetch(`${url}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          prompt: promptText,
          images: [base64Data],
          stream: false,
          format: "json",
        }),
      });

      if (!ollamaRes.ok) {
        throw new Error(`Ollama returned status ${ollamaRes.status}`);
      }

      const rawData: any = await ollamaRes.json();
      let parsedResult;
      try {
        parsedResult = JSON.parse(rawData.response);
      } catch (e) {
        let cleanStr = rawData.response.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedResult = JSON.parse(cleanStr);
      }
      res.json(parsedResult);
      return;
    }

    if (!ai) {
      res.json({ detection: "focused", confidence: 0.95 });
      return;
    }

    // Clean base64 string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    };

    let promptText = "Analyze this webcam snapshot of a student (Naveen) studying. Check if he is: 1) looking focused at the screen, 2) holding a phone / distracted, 3) yawning / looks sleepy, or 4) absent. Return exactly one word from these options: 'focused', 'phone', 'sleepy', 'absent' along with a very short funny 1-sentence comment from his anime companion Airi.";
    if (language === "te") {
      promptText += " IMPORTANT: Please write the comment entirely in Telugu (తెలుగు) using clean Telugu script. Address Naveen directly in a supportive, lively anime companion style!";
    }

    const textPart = {
      text: promptText,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detection: { type: Type.STRING, description: "One of: focused, phone, sleepy, absent" },
            comment: { type: Type.STRING, description: "Cute study coach reaction sentence." },
          },
          required: ["detection", "comment"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Vision Analysis Error:", error);
    
    // Smart offline/quota fallback for Gemini API daily rate limit exhaustion
    const isQuotaError = error.message?.toLowerCase().includes("429") || 
                         error.message?.toLowerCase().includes("quota") ||
                         error.status === 429 ||
                         error.statusCode === 429;
                         
    if (isQuotaError) {
      const isTelugu = req.body?.language === "te";
      const fallbackComment = isTelugu
        ? "నవీన్, నువ్వు బాగా చదువుకుంటున్నావు! ఇలాగే శ్రద్ధగా ఉండు!"
        : "Naveen, you are looking focused! Keep up the great work!";
      res.json({
        detection: "focused",
        comment: fallbackComment,
        quotaExceeded: true
      });
      return;
    }
    
    res.status(500).json({ error: "Failed to analyze frame." });
  }
});

// Setup Vite Dev Server / Static files
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Airi Server] Running at http://0.0.0.0:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Failed to start server:", err);
});
