import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: number | string
  icon: string
  color?: string
}

export default function StatCard({ label, value, icon, color = 'text-white' }: StatCardProps) {
  return (
    <Card className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/80">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <span className="text-2xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  )
}
