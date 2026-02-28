// Delegates to the unified report-analyzer for backward compatibility
import { analyzeReport } from './report-analyzer'

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface AIUrgencyResult {
  urgency: UrgencyLevel
  confidence: number // 0-1
  reasoning: string
  injuryDescription: string
  recommendedAction: string
  raw?: unknown
}

export async function scoreInjuryUrgency(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<AIUrgencyResult> {
  const analysis = await analyzeReport(imageBase64, mimeType)
  return {
    urgency: analysis.urgency,
    // analyzeReport returns 0-100; callers that expect 0-1 get normalized value
    confidence: analysis.confidence / 100,
    reasoning: analysis.reasoning,
    injuryDescription: analysis.injuryDescription,
    recommendedAction: analysis.recommendedAction,
    raw: analysis.raw,
  }
}
