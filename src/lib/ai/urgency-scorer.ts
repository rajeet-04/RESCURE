import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai'

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface AIUrgencyResult {
  urgency: UrgencyLevel
  confidence: number          // 0-1
  reasoning: string
  injuryDescription: string
  recommendedAction: string
  raw?: unknown
}

const URGENCY_PROMPT = `You are a veterinary triage AI for a stray animal rescue platform.

Analyze the provided image of an injured or vulnerable stray animal and respond ONLY with valid JSON matching this exact schema:

{
  "urgency": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "confidence": <number between 0 and 1>,
  "reasoning": "<1-2 sentence explanation>",
  "injuryDescription": "<brief description of visible injuries or condition>",
  "recommendedAction": "<what rescue team should do immediately>"
}

Urgency definitions:
- CRITICAL: Life-threatening (severe bleeding, unconscious, broken limbs, cannot breathe, severe burns, trauma)
- HIGH: Significant injury requiring same-day rescue (deep wounds, limping severely, visible infection, newborn/very young, trapped)
- MEDIUM: Injured but stable (minor wounds, mange, malnourished but mobile, sick but conscious)
- LOW: Vulnerable but not injured (thin stray, needs food/shelter, no visible injury)

Respond ONLY with the JSON object. No markdown, no explanation outside JSON.`

export async function scoreInjuryUrgency(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<AIUrgencyResult> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  })

  const result = await model.generateContent([
    URGENCY_PROMPT,
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ])

  const text = result.response.text().trim()

  // Strip markdown code fences if present
  const jsonStr = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()

  try {
    const parsed = JSON.parse(jsonStr) as AIUrgencyResult
    return { ...parsed, raw: result.response }
  } catch {
    // Fallback if JSON parse fails
    return {
      urgency: 'MEDIUM',
      confidence: 0.3,
      reasoning: 'AI parsing failed — defaulted to MEDIUM. Manual review required.',
      injuryDescription: 'Unable to parse AI response',
      recommendedAction: 'Manual triage required',
      raw: text,
    }
  }
}
