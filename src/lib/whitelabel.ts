import { promises as fs } from 'fs'
import path from 'path'

export interface WhitelabelConfig {
  appName: string
  primaryColor: string
  tagline: string
  logo?: string
  domain?: string
}

const CONFIG_PATH = path.join(process.cwd(), 'src', 'lib', 'whitelabel-config.json')

const DEFAULTS: WhitelabelConfig = {
  appName: 'RESCURE',
  primaryColor: '#f97316',
  tagline: 'Rescue. Recover. Reunite.',
}

export async function getWhitelabelConfig(): Promise<WhitelabelConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8')
    return { ...DEFAULTS, ...JSON.parse(raw) } as WhitelabelConfig
  } catch {
    return DEFAULTS
  }
}

export async function saveWhitelabelConfig(config: Partial<WhitelabelConfig>): Promise<WhitelabelConfig> {
  const current = await getWhitelabelConfig()
  const merged = { ...current, ...config }
  await fs.writeFile(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8')
  return merged
}
