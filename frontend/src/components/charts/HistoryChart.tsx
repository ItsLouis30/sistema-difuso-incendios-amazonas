import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORY_META } from '../../app/constants'
import { formatDate } from '../../app/format'
import type { HistoryPoint } from '../../types/api'

export function HistoryChart({ data }: { data: HistoryPoint[] }) {
  return (
    <div className="h-full w-full" aria-label="Evolución histórica del índice preventivo">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 4, left: -24, bottom: 0 }} barCategoryGap="28%">
          <XAxis
            dataKey="fecha"
            tickFormatter={(value) => formatDate(value, { day: '2-digit', month: 'short', year: undefined })}
            stroke="#66625e"
            tickLine={false}
            axisLine={false}
            minTickGap={18}
            fontSize={11}
          />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} stroke="#66625e" tickLine={false} axisLine={false} fontSize={11} />
          <Tooltip content={<HistoryTooltip />} cursor={{ fill: '#f3f3f3', radius: 8 }} />
          <Bar dataKey="indice" radius={[999, 999, 999, 999]} maxBarSize={14} isAnimationActive animationDuration={600}>
            {data.map((point) => (
              <Cell key={point.fecha} fill={CATEGORY_META[point.codigo].color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function HistoryTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: HistoryPoint }> }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-2xl bg-ink px-3 py-2 text-xs text-white">
      <strong className="block font-medium">{formatDate(point.fecha)}</strong>
      <span className="text-[#bdbdbd]">
        Índice {point.indice.toFixed(2)} · {point.categoria}
      </span>
    </div>
  )
}
