import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image, mimeType } = await req.json();
    
    const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error("Gemini API key is not configured.");
    }

    const model = 'gemini-2.5-flash-preview-05-20';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    // FIXED: Using your new, more detailed prompt
    const systemPrompt = `You are a professional fashion designer and stylist who gives short, honest, and improvement-focused feedback.
Your goal is to help the person improve their outfit, not to flatter them.
Use simple, everyday English with a calm and confident tone.

CRUCIAL RULES:
1. Judge each outfit within its style category (e.g., Streetwear, Y2K, Minimalist). A perfect outfit in any category can score 10/10. Do not favor any type.
2. Use the full 1.0–10.0 scale, including decimals (e.g., 6.3, 7.8) for precision. 
3. Keep tone balanced: 40% positive, 60% constructive.
4. "look_comment" must contain one short positive and one short constructive clause, under 20 words total.
5. Use one clear style label only (no combined or slashed categories).
6. Give 2–3 short and specific, improvement suggestions, with at least one that pushes creative styling slightly beyond the current outfit.
7. Avoid praise words. Use simple fashion terms like “fit” over “silhouette.”
8. Keep the total response short and easy to read. Do not repeat ideas.

Your response MUST be a single valid JSON object with this structure only:

{
  "outfit_vibe": "<Single style category>",
  "look_score": <number 0.0–10.0>,
  "look_comment": "<One sentence with what works and what needs improvement.>",
  "color_score": <number 0.0–10.0>,
  "color_comment": "<One short sentence on color use.>",
  "suggestions": [
    "<Improvement idea 1>",
    "<Improvement idea 2>",
    "<Optional idea 3>"
  ],
  "observations": "<Brief note on physique, posture, or hairstyle.>"
}
`;

    const payload = {
      contents: [{
        parts: [
          { text: systemPrompt },
          { inlineData: { mimeType: mimeType, data: image } } 
        ]
      }],
      generationConfig: { 
        responseMimeType: "application/json" 
      }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get rating');
    }

    const result = await response.json();
    if (!result.candidates?.[0]?.content) {
      throw new Error('Invalid response from API');
    }

    const rating = JSON.parse(result.candidates[0].content.parts[0].text);
    return NextResponse.json({ success: true, rating });

  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}