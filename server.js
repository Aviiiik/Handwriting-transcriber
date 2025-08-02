// server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares to parse JSON and serve static files
app.use(express.json({ limit: '10mb' })); // Increase limit for image data
app.use(express.static(path.join(__dirname))); // Serve static files like index.html

// API endpoint that mimics your serverless function
app.post('/api/transcribe', async (request, response) => {
  const apiKey = process.env.API_Key;

  if (!apiKey) {
    return response.status(500).json({ error: 'API key is not configured on the server.' });
  }

  try {
    const requestPayload = request.body;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API Error:", errorText);
      return response.status(geminiResponse.status).json({ error: `Gemini API failed: ${errorText}` });
    }

    const geminiResult = await geminiResponse.json();
    return response.status(200).json(geminiResult);

  } catch (error) {
    console.error('Error in proxy function:', error);
    return response.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});