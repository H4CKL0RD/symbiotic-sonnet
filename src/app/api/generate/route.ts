import { NextResponse } from 'next/server';

// This function constructs the prompt and calls the Cerebras API.
async function getAIGeneration(theme: string, lineNumber: number, history: string[], apiKey: string) {
  // The endpoint is now hardcoded.
  const apiUrl = "https://api.cerebras.ai/v1/chat/completions";

  const prompt = `You are a poet and a visual artist creating an abstract 3D experience. Your task is to generate one line of a four-line poem about the theme "${theme}". This is line number ${lineNumber + 1}. The previous lines were: "${history.join(' ')}".

  You must also generate a corresponding JSON object. The JSON must strictly follow this format: {"line": "your poetic line", "sceneBgColor": "#hex", "visuals": [ { ...shape_object_1... }, ... ]}.

  - "sceneBgColor": A single hex color for the entire scene's background, fitting the mood.
  - "visuals": An array of 5 to 7 shape objects. Each shape object must have:
    - "shape": Choose from: "icosahedron", "torus", "sphere", "dodecahedron", "cone", "cylinder", "torusKnot", "tetrahedron", "box", "octahedron", "capsule".
    - "position": An [x, y, z] coordinate array for the shape's starting position (x/z between -5 and 5, y between -2 and 2).
    - "shapeColor": A hex color for the shape's material.
    - "wireframe": A boolean (true or false).

  Your final output must be ONLY the raw JSON object, without any markdown formatting, backticks, or other explanatory text.`;

  // The payload for the Cerebras chat completions endpoint.
  const payload = {
    model: "llama-3.1-8b", // Example model, you can change this
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 1024
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // Use the key provided by the user.
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("API Error Response:", await response.text());
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();
    
    // Extract the content from the response.
    const rawText = result.choices[0].message.content;

    // Find and extract the JSON object from the raw text.
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("No valid JSON object found in the AI response.");
    }

    const jsonString = rawText.substring(jsonStart, jsonEnd);
    
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("Error calling or parsing AI API:", error);
    // Fallback to a mock response on error
    return { 
      line: "An error occurred. Please check your API key and the console.", 
      sceneBgColor: "#8B0000",
      visuals: [{
        shape: "box",
        position: [0, 0, 0],
        shapeColor: "#FFFFFF",
        wireframe: true,
      }]
    };
  }
}

export async function POST(request: Request) {
  try {
    const { theme, lineNumber, history, apiKey } = await request.json();

    if (typeof theme !== 'string' || typeof lineNumber !== 'number' || !Array.isArray(history) || typeof apiKey !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const generation = await getAIGeneration(theme, lineNumber, history, apiKey);
    return NextResponse.json(generation);

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
