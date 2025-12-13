import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load env vars
dotenv.config();

const app = express();

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json({ limit: "40mb" }));
app.use(express.static(__dirname));

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API route
app.post("/api/transcribe", async (req, res) => {
  const apiKey = process.env.API_Key;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    const apiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Clone payload from frontend
    const payload = { ...req.body };

    // ✅ Add Google Search ONLY when explicitly requested
    if (payload.needsSearch === true) {
      payload.tools = [{ googleSearch: {} }];
    }

    // ❗ IMPORTANT: Remove helper flag before sending to Gemini
    delete payload.needsSearch;

    const geminiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API Error:", errorText);
      return res
        .status(geminiResponse.status)
        .json({ error: "Gemini API request failed." });
    }

    const result = await geminiResponse.json();

    // ✅ Validate content
    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      return res.status(200).json(result);
    }

    return res.status(500).json({
      error: "Gemini returned an empty or blocked response.",
    });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Export for Vercel



// const port = process.env.PORT || 3000;
//   app.listen(port, async () => {
//     console.log(`Server running in port ${port}`);
//  });

// Export the app handler for Vercel.
export default app;
