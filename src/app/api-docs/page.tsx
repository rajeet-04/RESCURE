import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation — RESCURE',
  description: 'Public REST API documentation for the RESCURE platform',
}

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/incidents',
    description: 'List recent incident reports. Filter by urgency level.',
    params: '?limit=20&offset=0&urgency=HIGH',
    example: `{
  "data": [
    {
      "id": "clxxx...",
      "lat": 19.076,
      "lng": 72.877,
      "urgencyLevel": "HIGH",
      "status": "ASSIGNED",
      "createdAt": "2026-02-28T10:00:00.000Z",
      "address": "Andheri West, Mumbai"
    }
  ],
  "total": 142,
  "page": 0
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/animals',
    description: 'List animals available for adoption or in care.',
    params: '?status=READY_FOR_ADOPTION&limit=20',
    example: `{
  "data": [
    {
      "id": "clyyy...",
      "name": "Bruno",
      "species": "dog",
      "breed": "Indie",
      "status": "READY_FOR_ADOPTION",
      "publicSlug": "bruno-indie-2026",
      "photo": "https://cdn.example.com/bruno.jpg",
      "intakeDate": "2026-01-15T00:00:00.000Z"
    }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/ngos',
    description: 'List all verified NGOs on the platform.',
    params: '',
    example: `{
  "data": [
    {
      "id": "clzzz...",
      "name": "Paws of Hope",
      "city": "Mumbai",
      "state": "Maharashtra",
      "logo": "https://cdn.example.com/logo.png",
      "activeCaseCount": 12
    }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/stats',
    description: 'Platform-wide statistics. No authentication required.',
    params: '',
    example: `{
  "totalIncidents": 1842,
  "totalRescued": 1203,
  "totalAnimals": 654,
  "activeNGOs": 38,
  "totalSponsors": 210
}`,
  },
]

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🐾</span>
            <h1 className="text-3xl font-bold text-gray-900">RESCURE Public API</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Integrate RESCURE rescue data into your applications with our REST API.
          </p>
        </div>

        {/* Auth Notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-semibold text-amber-900 mb-2">🔑 Authentication</h2>
          <p className="text-amber-800 text-sm mb-3">
            API access requires an <strong>Enterprise subscription</strong>. Contact us to get your API key.
          </p>
          <p className="text-amber-800 text-sm mb-3">
            Pass your API key in the <code className="bg-amber-100 px-1 rounded font-mono">Authorization</code> header:
          </p>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            {`Authorization: Bearer YOUR_API_KEY`}
          </pre>
        </div>

        {/* Base URL */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Base URL</h2>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            {`https://rescure.app`}
          </pre>
        </div>

        {/* Endpoints */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Endpoints</h2>
          <div className="space-y-6">
            {endpoints.map((ep) => (
              <div key={ep.path} className="rounded-xl border bg-white p-6 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-800">
                    {ep.method}
                  </span>
                  <code className="font-mono text-sm text-gray-800 font-semibold">
                    {ep.path}{ep.params && <span className="text-gray-400">{ep.params}</span>}
                  </code>
                </div>
                <p className="text-gray-600 text-sm">{ep.description}</p>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Example Response</p>
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs overflow-x-auto leading-relaxed">
                    {ep.example}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate Limits */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Rate Limits</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Requests / min</th>
                <th className="pb-2 font-medium">Requests / day</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              <tr>
                <td className="py-2">Enterprise</td>
                <td className="py-2">120</td>
                <td className="py-2">50,000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Contact */}
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center">
          <p className="text-orange-800 font-medium">
            Need API access? <strong>API access requires Enterprise subscription.</strong>
          </p>
          <p className="text-orange-700 text-sm mt-1">
            Contact us to get your API key and start building.
          </p>
        </div>
      </div>
    </main>
  )
}
