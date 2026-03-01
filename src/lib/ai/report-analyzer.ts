// Unified Gemini-based report analyzer
// Returns structured triage data from an animal injury photo

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? '')

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
  confidence: 0,
  reasoning: 'Unable to analyze image — manual review required.',
  injuryDescription: 'Image analysis unavailable.',
  recommendedAction: 'Contact a nearby veterinarian or animal shelter.',
  animalType: 'Other',
  suggestedTitle: 'Animal needs help',
  suggestedDescription: 'An animal in distress was reported. Manual follow-up required.',
}

const PROMPT = `You are an expert veterinary triage AI for RESCURE, a stray animal rescue platform in India.
Analyze the provided animal photo and respond with ONLY a valid JSON object. No markdown, no code fences, no extra text.

Required JSON fields:
- urgency: string, one of exactly: CRITICAL, HIGH, MEDIUM, LOW
- confidence: integer between 0 and 100
- reasoning: string, 2-3 sentences of clinical justification using specific visible evidence from the photo
- injuryDescription: string, clinically precise description of every visible wound or abnormality
- recommendedAction: string, specific immediate action for the rescue team
- animalType: string, one of exactly: Dog, Cat, Bird, Cow, Horse, Monkey, Snake, Wildlife, Other
- suggestedTitle: string, 10-60 characters describing the emergency (e.g. "Dog with open leg wound and heavy bleeding")
- suggestedDescription: string, 2-4 sentences for the report including species, injury location, visible severity
- estimatedAge: string or null, one of: Puppy/Kitten, Young, Adult, Senior, or null if unknown

URGENCY LEVEL DEFINITIONS:
CRITICAL — life-threatening, rescue needed within minutes. Signs: active heavy bleeding, unconscious or unresponsive, cannot breathe, dangling or severed limb, severe head trauma, hit-by-vehicle with collapse.
HIGH — serious injury, rescue needed within hours. Signs: deep laceration or puncture wound, infected wound with pus or necrosis, broken bone, unable to bear weight, severe eye injury, trapped animal, newborn alone. Note: cows are always HIGH or CRITICAL in Indian context.
MEDIUM — injured but stable, rescue needed within 24 hours. Signs: moderate wound, limping but weight-bearing, mange covering large area, malnourished but alert, visible abscess.
LOW — vulnerable but not immediately dangerous. Signs: minor abrasion, mild limp, thin stray with no visible wound.

CONFIDENCE SCORING (do NOT default to 50 — pick the most accurate value):
90 to 100: Injury is unmistakably clear. Example: gaping wound with visible blood, animal clearly unconscious, severed limb visible.
75 to 89: Clear visible evidence. Example: obvious deep wound, animal cannot stand, swollen joint.
60 to 74: Moderate evidence, some ambiguity. Example: limping visible but wound not fully in frame.
45 to 59: Limited evidence. Example: animal partly hidden, blurry close-up, unclear lighting.
30 to 44: Condition inferred more than observed. Example: animal far away, only partial body visible.
0 to 29: Cannot reliably assess. Example: too dark, too blurry, animal barely visible in frame.

Example valid response (do not copy values, assess the actual image):
{"urgency":"HIGH","confidence":82,"reasoning":"The dog has a visibly deep laceration on its right hind leg with dried blood and exposed tissue. It is unable to bear weight on the injured limb.","injuryDescription":"Deep open wound approximately 5cm on right hind leg with dried blood; no active bleeding visible; limb held off ground.","recommendedAction":"Transport to veterinary clinic immediately; apply pressure bandage if available; do not let animal walk.","animalType":"Dog","suggestedTitle":"Dog with deep leg wound unable to walk","suggestedDescription":"A stray dog was found with a serious laceration on its right hind leg. The wound appears deep with dried blood and the dog cannot bear weight. Immediate veterinary attention is required.","estimatedAge":"Adult"}
`.trim()

export async function analyzeReport(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<AIReportAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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

    // Robustly extract JSON — strip markdown fences, find first { ... } block
    let cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    // If Gemini wrapped output in extra text, extract the JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) cleaned = jsonMatch[0]

    const parsed = JSON.parse(cleaned) as Partial<AIReportAnalysis>

    // Normalise urgency — Gemini sometimes includes pipes or extra text
    const VALID_URGENCY = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const
    const rawUrgency = String(parsed.urgency ?? '').toUpperCase().trim()
    const urgency = VALID_URGENCY.find((u) => rawUrgency.includes(u)) ?? FALLBACK.urgency

    // Normalise animalType
    const VALID_ANIMALS = ['Dog', 'Cat', 'Bird', 'Cow', 'Horse', 'Monkey', 'Snake', 'Wildlife', 'Other'] as const
    const rawAnimal = String(parsed.animalType ?? '')
    const animalType = VALID_ANIMALS.find((a) => rawAnimal.toLowerCase().includes(a.toLowerCase())) ?? FALLBACK.animalType

    return {
      urgency,
      confidence: typeof parsed.confidence === 'number'
        ? Math.min(100, Math.max(0, Math.round(parsed.confidence)))
        : 0,
      reasoning: parsed.reasoning ?? FALLBACK.reasoning,
      injuryDescription: parsed.injuryDescription ?? FALLBACK.injuryDescription,
      recommendedAction: parsed.recommendedAction ?? FALLBACK.recommendedAction,
      animalType,
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
