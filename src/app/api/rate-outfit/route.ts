import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 15; // allow extra time for image+LLM

export async function POST(req: Request) {
  try {
    // Require authentication using Supabase access token
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { image, mimeType } = await req.json();
    // Basic validation: image should be a base64 string (no data: prefix) and reasonable size
    if (!image || typeof image !== 'string' || /\s/.test(image)) {
      throw new Error('Invalid image payload');
    }
    // Reject very large images to avoid overloading serverless functions
    const approxBytes = Math.ceil(image.length * 3 / 4);
    if (approxBytes > 2.5 * 1024 * 1024) { // ~2.5MB
      throw new Error('Image too large. Please upload a smaller image.');
    }
    
    // Use server-side secret only (do not rely on NEXT_PUBLIC here)
    const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
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
2. Use 1.0–10.0 scale with decimals. The score reflects execution, not style.
   - 9.0–10.0: Excellent. A clear vision, very well executed. No major flaws.
   - 8.0–8.9: Very Good. A strong, confident look. Small tweaks could make it perfect.
   - 7.0–7.9: Good. A solid foundation. The outfit works well and shows clear effort.
   - 6.0–6.9: Decent. The core items work together, but it feels "safe" or "unfinished."
   - below 6.0: Weak. The items feel uncoordinated or the theme is unclear.
3. "look_comment" must be simple, direct English (under 25 words).
   - One positive, one improvement.
   - AVOID complex/praise words: "cohesive," "elevated," "nice," "flattering."
   - USE clear words: "fit is clean," "looks messy," "shape is good."
4. Use one clear style label only (no combined or slashed categories).
5. Give 2-3 specific suggestions.
   - Sug 1: Fix the main weakness (e.g., "Tuck in the shirt").
   - Sug 2: Creative upgrade. If base is thin then it MUST be (A) a new layer, (B) a new texture/material, (C) a style mix (e.g., "add a formal blazer"), OR (D) PROPORTION: "Wear the [item] in a new way (e.g., 'French tuck') to fix the outfit's shape. (If shape is off).
    (E) COLOR/CONTRAST: Swap/Add a [specific item] to introduce a 'pop of color' or create a 'tonal' look. (If color is the problem).).
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
  "look_comment": "<One short sentence with what works and what really is problem.>",
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
      let message = 'Failed to get rating';
      try {
        const errorData = await response.json();
        message = errorData.error?.message || message;
      } catch {}
      throw new Error(message);
    }

    const result = await response.json();
    if (!result.candidates?.[0]?.content) {
      throw new Error('Invalid response from API');
    }

    // API returns text with JSON. Guard against trailing text.
    const rawText: string = result.candidates[0].content.parts[0].text;
    type Rating = {
      outfit_vibe: string;
      look_score: number;
      look_comment: string;
      color_score: number;
      color_comment: string;
      suggestions: string[];
      observations: string;
    };
    let rating: Rating;
    try {
      rating = JSON.parse(rawText) as Rating;
    } catch {
      // Attempt to extract JSON object if model added extra text
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Model returned non-JSON response');
      rating = JSON.parse(match[0]) as Rating;
    }
    return NextResponse.json({ success: true, rating });

  } catch (error: unknown) {
    console.error('API Route Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    // Map some common issues to 400 to avoid noisy 500s in client
    const isClient = /Invalid image|too large|not configured|non-JSON/.test(errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: isClient ? 400 : 500 });
  }
}