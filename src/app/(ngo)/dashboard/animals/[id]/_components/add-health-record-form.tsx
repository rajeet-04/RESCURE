'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  type: z.enum(['VACCINATION', 'TREATMENT', 'DIAGNOSIS', 'SURGERY', 'CHECKUP', 'NOTE']),
  title: z.string().min(1, 'Title is required'),
  notes: z.string().optional(),
  date: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function AddHealthRecordForm({ animalId }: { animalId: string }) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'CHECKUP' },
  })

  const onSubmit = async (data: FormValues) => {
    const res = await fetch(`/api/animals/${animalId}/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      reset()
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Health Record</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              defaultValue="CHECKUP"
              onValueChange={(val) =>
                setValue('type', val as FormValues['type'], { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {['VACCINATION', 'TREATMENT', 'DIAGNOSIS', 'SURGERY', 'CHECKUP', 'NOTE'].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Title</Label>
            <Input {...register('title')} placeholder="e.g. Rabies vaccine" />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea {...register('notes')} placeholder="Additional notes..." rows={3} />
          </div>

          <div className="space-y-1">
            <Label>Date</Label>
            <Input type="date" {...register('date')} />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving...' : 'Add Record'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
