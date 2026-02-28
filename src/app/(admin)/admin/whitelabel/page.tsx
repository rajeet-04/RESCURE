import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getWhitelabelConfig } from '@/lib/whitelabel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import WhitelabelForm from './_components/whitelabel-form'

export const metadata = { title: 'White-Label Settings — RESCURE Admin' }

export default async function WhitelabelPage() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    redirect('/unauthorized')
  }

  const config = await getWhitelabelConfig()

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">White-Label Configuration</h1>
      <p className="mb-8 text-sm text-gray-500">Customize the platform branding for enterprise deployments.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Branding Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <WhitelabelForm initialConfig={config} />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden shadow-sm">
              {/* Mock header */}
              <div
                className="flex items-center gap-2 px-4 py-3 text-white"
                style={{ backgroundColor: config.primaryColor }}
              >
                {config.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={config.logo} alt="Logo" className="h-6 w-6 rounded object-contain" />
                ) : (
                  <span className="text-xl">🐾</span>
                )}
                <span className="font-bold text-lg">{config.appName}</span>
              </div>
              {/* Mock hero */}
              <div className="bg-white p-6 text-center space-y-2">
                <p className="text-lg font-semibold text-gray-800">{config.appName}</p>
                <p className="text-sm text-gray-500">{config.tagline}</p>
                <div
                  className="inline-block mt-3 px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Report an Animal
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex gap-2">
                <span className="font-medium w-28">App Name:</span>
                <span>{config.appName}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium w-28">Tagline:</span>
                <span>{config.tagline}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium w-28">Primary Color:</span>
                <span
                  className="w-5 h-5 rounded-full border"
                  style={{ backgroundColor: config.primaryColor }}
                />
                <span className="font-mono text-xs">{config.primaryColor}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
