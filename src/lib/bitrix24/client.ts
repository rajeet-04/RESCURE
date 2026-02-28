// Bitrix24 REST webhook client for NGO outreach CRM logging
// Gracefully no-ops when BITRIX24_WEBHOOK_URL is not configured

const getWebhookBase = () => process.env.BITRIX24_WEBHOOK_URL?.replace(/\/$/, '') ?? null

export interface NGOLeadParams {
  name: string
  phone: string | null
  website: string | null
  address: string | null
  incidentId: string
  incidentDescription: string
  lat: number | null
  lng: number | null
}

export interface CallActivityParams {
  leadId: string
  subject: string
  description: string
  phone: string
}

/** Creates a CRM lead for an external NGO. Returns the lead ID or null. */
export async function createNGOLead(params: NGOLeadParams): Promise<string | null> {
  const base = getWebhookBase()
  if (!base) {
    console.warn('[bitrix24] BITRIX24_WEBHOOK_URL not set — skipping CRM lead creation')
    return null
  }

  try {
    const body = {
      fields: {
        TITLE: `[RESCURE] Animal incident near ${params.name}`,
        NAME: params.name,
        // PHONE expects array of objects with VALUE and VALUE_TYPE
        ...(params.phone
          ? { PHONE: [{ VALUE: params.phone, VALUE_TYPE: 'WORK' }] }
          : {}),
        ...(params.website ? { WEB: [{ VALUE: params.website, VALUE_TYPE: 'WORK' }] }
          : {}),
        ADDRESS: params.address ?? '',
        COMMENTS: `Incident ID: ${params.incidentId}\n\n${params.incidentDescription}`,
        SOURCE_ID: 'WEB',
        STATUS_ID: 'NEW',
        ...(params.lat != null && params.lng != null
          ? { UF_CRM_MAP: `${params.lat},${params.lng}` }
          : {}),
      },
    }

    const res = await fetch(`${base}/crm.lead.add.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) {
      console.warn('[bitrix24] crm.lead.add HTTP error:', res.status)
      return null
    }

    const data = (await res.json()) as { result?: number | string; error?: string }
    if (data.error) {
      console.warn('[bitrix24] crm.lead.add error:', data.error)
      return null
    }
    return data.result?.toString() ?? null
  } catch (err) {
    console.warn('[bitrix24] createNGOLead exception:', err)
    return null
  }
}

/** Logs an outgoing call activity on an existing lead. Returns success flag. */
export async function logCallActivity(params: CallActivityParams): Promise<boolean> {
  const base = getWebhookBase()
  if (!base) return false

  try {
    const body = {
      fields: {
        OWNER_TYPE_ID: 1, // 1 = Lead
        OWNER_ID: params.leadId,
        TYPE_ID: 2, // 2 = Call
        DIRECTION: 2, // 2 = Outgoing
        SUBJECT: params.subject,
        DESCRIPTION: params.description,
        COMPLETED: 'N',
        COMMUNICATIONS: [{ VALUE: params.phone, TYPE: 'PHONE' }],
      },
    }

    const res = await fetch(`${base}/crm.activity.add.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return false
    const data = (await res.json()) as { result?: unknown; error?: string }
    return !data.error
  } catch (err) {
    console.warn('[bitrix24] logCallActivity exception:', err)
    return false
  }
}
