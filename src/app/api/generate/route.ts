import { NextResponse } from 'next/server';

// This function constructs the prompt and calls the Cerebras API.
async function getAIGeneration(theme: string, lineNumber: number, history: string[]) {
  // Use environment variables for API credentials
  const apiKey = process.env.CEREBRAS_API_KEY;
  const apiUrl = process.env.CEREBRAS_API_ENDPOINT + "/chat/completions";

  const prompt = `You are a poet and a visual artist. Your task is to generate one line of a four-line poem about the theme "${theme}". This is line number ${lineNumber + 1}. The previous lines were: "${history.join(' ')}".

  You must also generate corresponding JSON object for the visuals. The JSON must strictly follow this format: {"line": "your poetic line", "visuals": {"bgColor": "#hex", "circleColor": "#hex", "size": number, "speed": number}}.

  - bgColor: hex for background, fitting the mood.
  - circleColor: hex for circle, contrasting with background.
  - size: diameter of circle (between 20 and 100).
  - speed: pulse animation duration in seconds (between 2 and 8).

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
    max_tokens: 100,
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
    return { line: "An error occurred in the digital ether.", visuals: { bgColor: "#8B0000", circleColor: "#FFFFFF", size: 50, speed: 2 } };
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
