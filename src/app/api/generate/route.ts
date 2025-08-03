import { NextResponse } from 'next/server';

// This function constructs the prompt and calls the Cerebras API.
async function getAIGeneration(theme: string, lineNumber: number, history: string[]) {
  // Use environment variables for API credentials
  const apiKey = process.env.CEREBRAS_API_KEY;
  const apiUrl = process.env.CEREBRAS_API_ENDPOINT + "/chat/completions";

  const prompt = `You are a poet and a visual artist creating an abstract 3D physics simulation. Your task is to generate one line of a four-line poem about the theme "${theme}". This is line number ${lineNumber + 1}. The previous lines were: "${history.join(' ')}".

You must also generate a corresponding JSON object. The JSON must strictly follow this format: {"line": "your poetic line", "sceneBgColor": "#hex", "visuals": [ { ...shape_object_1... }, ... ]}.

- "sceneBgColor": A single hex color for the entire scene's background, fitting the mood.
- "visuals": An array of 2 to 7 shape objects. Each shape object must have:
  - "shape": Choose from: "icosahedron", "torus", "sphere", "dodecahedron", "cone", "cylinder", "torusKnot", "tetrahedron", "box", "octahedron", "capsule".
  - "position": An [x, y, z] coordinate array for the shape's starting position (x and z between -5 and 5, y between -2 and 2).
  - "shapeColor": A hex color for the shape's material.
  - "wireframe": A boolean (true or false).
  - "mass": A number for mass (between 1 and 5).
  - "restitution": A number for bounciness (between 0.5 and 1.2).
  - "initialImpulse": An [x, y, z] array for a starting push (values between -10 and 10).

Your final output must be ONLY the raw JSON object, without any markdown formatting, backticks, or other explanatory text.`;

  // IMPORTANT: The payload structure will likely need to be changed to match the Cerebras API.
  // This is a generic example.
  const payload = {
    model: "llama3.1-8b",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 512,
    temperature: 0.7,
    // You might need other parameters like max_tokens, temperature, etc.
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // This is a common authorization pattern; adjust if needed.
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("API Error Response:", await response.text());
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    // Check if the response contains the expected structure
    if (!result || !result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Unexpected API response structure');
    }

    // Parse and return the JSON response from the AI
    const jsonResponse = JSON.parse(result.choices[0].message.content);
    return jsonResponse;
  } catch (error) {
    console.error("Error calling AI API:", error);
    // Fallback to a mock response on error
    return { line: "An error occurred in the digital ether.", visuals: [{ shape: "icosahedron", position: [0, 0, 0], shapeColor: "#FFFFFF", wireframe: true, rotationSpeed: 0.5, focusPoint: [0, 0, 0] }] };
  }
}

export async function POST(request: Request) {
  try {
    const { theme, lineNumber, history } = await request.json();

    if (typeof theme !== 'string' || typeof lineNumber !== 'number' || !Array.isArray(history)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const generation = await getAIGeneration(theme, lineNumber, history);
    return NextResponse.json(generation);

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
