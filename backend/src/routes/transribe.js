// routes/transcribe.js
import express from "express";
import multer from "multer";
import { OpenAI } from "openai";

const router = express.Router();
const upload = multer(); // parse multipart/form-data

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", upload.single("audio"), async (req, res) => {
  try {
    const fileBuffer = req.file.buffer;

    const transcription = await openai.audio.transcriptions.create({
      file: {
        name: "voice.webm", // can be webm or wav
        buffer: fileBuffer,
        type: "audio/webm"
      },
      model: "whisper-1"
    });

    res.json({ text: transcription.text });
  } catch (error) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

export default router;
