// Unified Gemini-based report analyzer
// Returns structured triage data from an animal injury photo

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export interface AIReportAnalysis {
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: number // 0–100
  reasoning: string
  injuryDescription: string
  recommendedAction: string
  animalType: string
  suggestedTitle: string
  suggestedDescription: string
  estimatedAge?: string
  raw?: string
}

const FALLBACK: AIReportAnalysis = {
  urgency: 'MEDIUM',
  confidence: 50,
  reasoning: 'Unable to analyze image — manual review required.',
  injuryDescription: 'Image analysis unavailable.',
  recommendedAction: 'Contact a nearby veterinarian or animal shelter.',
  animalType: 'Other',
  suggestedTitle: 'Animal needs help',
  suggestedDescription: 'An animal in distress was reported. Manual follow-up required.',
}

const PROMPT = `
You are a veterinary triage AI. Analyze this animal injury/distress photo and return ONLY a JSON object with exactly these fields:

{
  "urgency": one of "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "confidence": integer 0-100 (how confident you are in this assessment),
  "reasoning": "brief clinical reasoning (2-3 sentences)",
  "injuryDescription": "visible injuries or conditions described clinically",
  "recommendedAction": "specific immediate action recommended",
  "animalType": "Dog" | "Cat" | "Bird" | "Cow" | "Horse" | "Monkey" | "Snake" | "Wildlife" | "Other",
  "suggestedTitle": "short incident title (max 60 chars)",
  "suggestedDescription": "detailed description for the report (2-4 sentences)",
  "estimatedAge": "Puppy/Kitten/Young/Adult/Senior (optional, best guess)"
}

Severity definitions:
- CRITICAL: life-threatening (severe bleeding, unconscious, cannot breathe, trauma)
- HIGH: urgent (deep wounds, broken limbs, severe burns, cannot stand)
- MEDIUM: significant (moderate wounds, limping, visible distress)
- LOW: minor (small cuts, mild limping, alert and responsive)

Return ONLY the JSON. No markdown, no explanation, no code block.
`.trim()

export async function analyzeReport(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<AIReportAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent([
      PROMPT,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        },
      },
    ])

    const text = result.response.text().trim()
    // Strip any accidental markdown code fences
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')

    const parsed = JSON.parse(cleaned) as Partial<AIReportAnalysis>

    return {
      urgency: parsed.urgency ?? FALLBACK.urgency,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 60,
      reasoning: parsed.reasoning ?? FALLBACK.reasoning,
      injuryDescription: parsed.injuryDescription ?? FALLBACK.injuryDescription,
      recommendedAction: parsed.recommendedAction ?? FALLBACK.recommendedAction,
      animalType: parsed.animalType ?? FALLBACK.animalType,
      suggestedTitle: parsed.suggestedTitle ?? FALLBACK.suggestedTitle,
      suggestedDescription: parsed.suggestedDescription ?? FALLBACK.suggestedDescription,
      estimatedAge: parsed.estimatedAge,
      raw: text,
    }
  } catch (err) {
    console.error('[report-analyzer] analyzeReport error:', err)
    return FALLBACK
  }
}
