import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const app = express();

// This is the correct way to get the directory name when using ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares to parse JSON and serve static files
app.use(express.json({ limit: '40mb' })); // Increase limit for image data
app.use(express.static(__dirname)); // Serves other static files if you add them (e.g., CSS)

// Explicitly define the route for the homepage to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// API endpoint that mimics your serverless function
app.post('/api/transcribe', async (request, response) => {
  const apiKey = process.env.API_Key;

  if (!apiKey) {
    return response.status(500).json({ error: 'API key is not configured on the server.' });
  }

  try {
    const requestPayload = request.body;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  
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
// const port = process.env.PORT || 3000;
//  app.listen(port, async () => {
//    console.log(`Server running in port ${port}`);
// });

// Export the app handler for Vercel.
export default app;
