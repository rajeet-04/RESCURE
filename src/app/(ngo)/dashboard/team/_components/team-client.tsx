'use client'

import { useState, useCallback } from 'react'
import { Users, UserPlus, Briefcase, MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import InviteWorkerDialog from './invite-worker-dialog'
import AssignTaskDialog from './assign-task-dialog'

interface Worker {
  id: string
  available: boolean
  lat: number | null
  lng: number | null
  lastSeenAt: Date | null
  createdAt: Date
  user: { name: string | null; email: string | null; image: string | null }
  _count: { rescueCases: number }
}

interface TeamClientProps {
  workers: Worker[]
  ngo: { id: string; name: string }
}

export default function TeamClient({ workers: initial, ngo }: TeamClientProps) {
  const [workers, setWorkers] = useState<Worker[]>(initial)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<Worker | null>(null)

  const handleAssigned = useCallback(() => {
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === assignTarget?.id ? { ...w, available: false } : w
      )
    )
  }, [assignTarget])

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {workers.length} field worker{workers.length !== 1 ? 's' : ''} in {ngo.name}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Field Worker
        </Button>
      </div>

      {/* Empty state */}
      {workers.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400 gap-4">
          <Users className="h-10 w-10" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-500">No field workers yet.</p>
            <p className="text-xs">
              Click <strong>Add Field Worker</strong> to generate an invite link and share it with your team.
            </p>
          </div>
          <Button variant="outline" onClick={() => setInviteOpen(true)} className="gap-2 mt-2">
            <UserPlus className="h-4 w-4" />
            Invite Your First Worker
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <Card key={worker.id} className="border shadow-sm">
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  {worker.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={worker.user.image}
                      alt={worker.user.name ?? ''}
                      className="h-10 w-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-semibold text-sm">
                      {(worker.user.name ?? 'W').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {worker.user.name ?? 'Unnamed Worker'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{worker.user.email ?? ''}</p>
                  </div>
                  <Badge
                    className={`ml-auto shrink-0 text-xs ${
                      worker.available
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                    variant="outline"
                  >
                    {worker.available ? 'Available' : 'Busy'}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-orange-500" />
                    <span>
                      {worker._count.rescueCases} case
                      {worker._count.rescueCases !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {worker.lastSeenAt ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>
                        Active{' '}
                        {formatDistanceToNow(new Date(worker.lastSeenAt), { addSuffix: true })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Never active</span>
                    </div>
                  )}
                  {worker.lat && worker.lng ? (
                    <div className="col-span-2 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" />
                      <span className="font-mono">
                        {worker.lat.toFixed(4)}, {worker.lng.toFixed(4)}
                      </span>
                    </div>
                  ) : (
                    <div className="col-span-2 flex items-center gap-1.5 text-gray-300">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Location unknown</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-300">
                  Joined {formatDistanceToNow(new Date(worker.createdAt), { addSuffix: true })}
                </p>

                {/* Assign Task button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => setAssignTarget(worker)}
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  Assign Task
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Dialog */}
      <InviteWorkerDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        ngoId={ngo.id}
        ngoName={ngo.name}
      />

      {/* Assign Task Dialog */}
      {assignTarget && (
        <AssignTaskDialog
          open={!!assignTarget}
          onOpenChange={(o) => { if (!o) setAssignTarget(null) }}
          workerId={assignTarget.id}
          workerName={assignTarget.user.name ?? 'Worker'}
          onAssigned={handleAssigned}
        />
      )}
    </>
  )
}
