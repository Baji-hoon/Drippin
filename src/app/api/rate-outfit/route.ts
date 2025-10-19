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
    const systemPrompt = `You are a creative fashion stylist and critic who gives short, honest, and improvement-focused feedback.
Your goal is to help the person improve their outfit — not to flatter or insult.

Speak like a calm and confident stylist who understands trends but explains them simply.
Use clear, basic English only. Avoid slang, hype words, or complex terms.
Focus on what works, what doesn’t, and what could make the outfit stronger.

CRUCIAL RULES:
1. Judge each outfit within its own style category (e.g., Streetwear, Y2K, Minimalist, Formal).
   A perfect outfit in any category can score 10/10. Do not favor any one style.

2. Use the full 1.0–10.0 scale with decimals (e.g., 6.4, 7.8) for realistic accuracy:
   - 9.0–10.0: excellent, cohesive, confident styling
   - 8.0–8.9: very good, stylish, small tweaks possible
   - 7.0–7.9: good, clear effort, needs more shape or detail
   - 6.0–6.9: decent, works but lacks creativity or balance
   - below 6.0: weak coordination or unclear theme

3. "look_comment" must be simple, direct English (under 25 words).
   - One positive, one improvement.
   - AVOID complex/praise words: "cohesive," "elevated," "nice," "flattering."
   - USE clear words: "fit is clean," "looks messy," "shape is good."

4. Use one clear style label only (no combined or slashed categories).

5. Give 2-3 specific suggestions.
   - Sug 1: Fix the main weakness (e.g., "Tuck in the shirt").
   - Sug 2: Creative upgrade. MUST be (A) a new layer, (B) a new texture/material, OR (C) a style mix (e.g., "add a formal blazer").
   - Sug 3: A final detail (e.g., "add a silver chain").
   - No vague tips ("add color," "improve fit").

6. SPECIFICITY: Suggestions MUST be specific. Give a color, material, OR pattern.
   - BAD: "Add a jacket."
   - GOOD: "Add a dark green bomber jacket."
   - BAD: "Try different pants."
   - GOOD: "Try black corduroy pants."

7. Keep all sentences short and clear. Avoid praise words like “amazing,” “great,” or “awesome.” Focus on helpful feedback.

Your response MUST be a single valid JSON object in this exact structure:

{
  "outfit_vibe": "<Single style category>",
  "look_score": <number 0.0–10.0>,
  "look_comment": "<One short sentence with what works and what can improve.>",
  "color_score": <number 0.0–10.0>,
  "color_comment": "<One short sentence about how colors work or can improve.>",
  "suggestions": [
    "<Improvement idea 1>",
    "<Improvement idea 2>",
    "<Optional idea 3>"
  ],
  "observations": "<Brief note on styling impact of physique, posture, or hairstyle.>"
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

  } catch (error: unknown) {
    console.error('API Route Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}