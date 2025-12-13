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
app.use(express.static(path.join(__dirname, '/'))); // Serves other static files if you add them (e.g., CSS)

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
    let requestPayload = request.body;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Add the Google Search Tool configuration (necessary for resource generation)
    let payloadWithTool = { ...requestPayload };
    if (!payloadWithTool.tools) {
        payloadWithTool.tools = [];
    }
    payloadWithTool.tools.push({ googleSearch: {} });
  
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadWithTool), 
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API Error:", errorText);
      // Return a structured failure message for the client
      return response.status(geminiResponse.status).json({ success: false, error: `External API failed: ${geminiResponse.status}` });
    }

    const geminiResult = await geminiResponse.json();
    
    // --- MODIFIED LOGIC: CHECK FOR VALID CONTENT AND RETURN MESSAGE OR DATA ---

    let content = null;
    if (geminiResult.candidates && geminiResult.candidates.length > 0 && 
        geminiResult.candidates[0].content && geminiResult.candidates[0].content.parts &&
        geminiResult.candidates[0].content.parts.length > 0) {
        
        content = geminiResult.candidates[0].content.parts[0].text;
    }
    
    // Check if the request originated from the frontend requiring specific content (based on app.js expectation)
    // If content is found, return the content along with a success flag
    if (content) {
        // Return the content directly as expected by the frontend 'app.js' logic. 
        // We cannot simply return a success message because the frontend needs the transcribed/proofread text 
        // or the resource links to update the UI.
        return response.status(200).json(geminiResult);
    } 
    
    // If no content was found but the request didn't error, check for safety reasons
    if (geminiResult.candidates && geminiResult[0].finishReason !== 'STOP') {
        return response.status(200).json({ 
            success: false, 
            error: `Model stopped processing due to: ${geminiResult.candidates[0].finishReason}. Content may have been blocked.`
        });
    }

    // Default failure if content is empty or unexpected
    return response.status(500).json({ success: false, error: 'AI model returned an unexpected or empty response.' });


  } catch (error) {
    console.error('Error in proxy function:', error);
    return response.status(500).json({ success: false, error: 'An internal server error occurred.' });
  }
});

// const port = process.env.PORT || 3000;
//   app.listen(port, async () => {
//     console.log(`Server running in port ${port}`);
//  });

// Export the app handler for Vercel.
export default app;