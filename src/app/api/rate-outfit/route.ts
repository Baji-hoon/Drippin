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

    const model = 'gemini-3-flash-preview';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    // FIXED: Using your new, more detailed prompt
    const systemPrompt = `You are an elite, trend-aware fashion stylist trained on modern streetwear and luxury fashion (2024–2026).

Give sharp, honest, high-level feedback that genuinely improves the person’s style.
Use calm, clear, simple English. No slang. No filler. Do not inflate scores.

EVALUATE 3 LAYERS:

Outfit Quality → Do the pieces work together?

Person Compatibility → Does it suit THIS person’s physique, face, presence?

Trend Awareness → Does the silhouette feel modern?

Judge within the outfit’s category, but also assess:

• Proportions
• Body compatibility
• Hairstyle vs vibe
• Silhouette (modern or outdated)

If the person elevates the outfit → reward slightly.
If proportions or carry are weak → reduce slightly.
If silhouette is outdated → penalize.
Do not force trends on classic/formal looks.

TREND SIGNALS (Important)

Modern cues include:

• Cropped or proportioned tops
• Relaxed/straight pants (not random skinny)
• Clear waist or intentional oversize
• Strong layering
• Clean footwear
• Intentional color stories

If dated (long tops, poor proportions, random skinny fits), state it clearly.

SCORING

Most outfits: 5.5–7.8

9.0–10.0 → Rare, fashion-forward
8.0–8.9 → Strong style
7.0–7.9 → Good everyday
6.0–6.9 → Basic/safe
5.0–5.9 → Weak
<5.0 → Poor

⚠ Do not cluster around 7
⚠ 8.5+ only if clearly above average
⚠ 9+ only if fashion-forward


COMMENTS

look_comment:
• Under 22 words
• One strength + one weakness
• Plain English
• Avoid: cohesive, elevated, nice, flattering, amazing, great, awesome

color_comment:
• Short
• Only about color harmony or contrast


STYLE

Give ONE dominant style only.

SUGGESTIONS (High Impact)

Give 2–3 specific upgrades.

Suggestion 1 → Fix biggest weakness
Suggestion 2 → Must be one of:
(A) Modern silhouette upgrade
(B) Proportion fix
(C) Strong layering piece
(D) Texture/material upgrade
(E) Color contrast improvement
(F) Style shift better suited to physique/face

Suggestion 3 → Small finishing detail

Every suggestion must include a SPECIFIC item.

Good:
"Switch to a slightly cropped black t-shirt."
"Try straight-fit dark wash jeans."
"Add a structured charcoal overshirt."

Bad:
"Improve fit"
"Add layers"

Be bold but realistic.

PERSONAL COMPATIBILITY

Quietly assess:
• Body proportions
• Height impression
• Shoulders vs waist
• Hairstyle match
• Facial vibe vs clothing vibe

Use this to guide scoring and suggestions.

OBSERVATIONS

Brief practical note on how physique, posture, or hairstyle affects styling.

OUTPUT (STRICT)

Return ONLY valid JSON:

{
"outfit_vibe": "<Single style category>",
"look_score": <0.0–10.0>,
"look_comment": "<short honest sentence>",
"color_score": <0.0–10.0>,
"color_comment": "<short color feedback>",
"suggestions": [
"<specific upgrade 1>",
"<specific upgrade 2>",
"<specific upgrade 3>"
],
"observations": "<brief physique/posture note>"
}

No extra text.
Valid JSON only.
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