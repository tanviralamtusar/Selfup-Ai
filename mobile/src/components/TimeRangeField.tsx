import { View } from 'react-native'

import { formatTime, PickerField } from '@/components/PickerField'
import { Muted, Segmented } from '@/ui/primitives'
import { space } from '@/ui/theme'

/**
 * Schedule a task at a single time or over a range. `end` set is what makes
 * it a range (mirrors web/src/lib/task-time.ts); switching back to a single
 * time clears it, so the pair stays valid.
 */
export function TimeRangeField({
  label = 'Time',
  start,
  end,
  onChange,
  placeholder = 'No time',
}: {
  label?: string
  start: string | null
  end: string | null
  onChange: (next: { start: string | null; end: string | null }) => void
  placeholder?: string
}) {
  const isRange = end !== null

  const setMode = (mode: 'single' | 'range') => {
    if ((mode === 'range') === isRange) return
    if (mode === 'single') return onChange({ start, end: null })
    // Default to an hour after the start so the range is valid straight away.
    const from = start ?? '09:00'
    const [h, m] = from.split(':').map(Number)
    const next = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    onChange({ start: from, end: h + 1 > 23 ? '23:59' : next })
  }

  return (
    <>
      <Segmented
        label={label}
        options={[{ value: 'single', label: 'Time' }, { value: 'range', label: 'Range' }] as const}
        value={isRange ? 'range' : 'single'}
        onChange={setMode}
      />
      {isRange ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <PickerField
              label="From"
              mode="time"
              value={start}
              // Clearing the start clears the range: an end alone isn't valid.
              onChange={(v) => onChange({ start: v, end: v ? end : null })}
              placeholder={placeholder}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PickerField label="To" mode="time" value={end} onChange={(v) => onChange({ start, end: v })} placeholder="End" />
          </View>
        </View>
      ) : (
        <PickerField label={label} mode="time" value={start} onChange={(v) => onChange({ start: v, end: null })} placeholder={placeholder} />
      )}
      {isRange && start && end && end <= start && (
        <Muted>End time must be after {formatTime(start)}.</Muted>
      )}
    </>
  )
}

/** "09:00" or "09:00 – 10:30" for a row subtitle; '' when unscheduled. */
export function formatRange(start: string | null, end: string | null): string {
  if (!start) return ''
  const t = (v: string) => formatTime(v.slice(0, 5))
  return end ? `${t(start)} – ${t(end)}` : t(start)
}
