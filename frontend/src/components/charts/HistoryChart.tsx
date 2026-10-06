import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceArea } from 'recharts'
import { formatDate } from '../../app/format'
import type { HistoryPoint } from '../../types/api'

export function HistoryChart({ data }: { data: HistoryPoint[] }) {
  return (
    <div className="chart-frame history-chart" aria-label="Evolución histórica del índice preventivo">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, left: -18, bottom: 2 }}>
          <CartesianGrid stroke="rgba(168,188,181,.09)" vertical={false} />
          <ReferenceArea y1={0} y2={37.5} fill="#4ade80" fillOpacity={0.035} />
          <ReferenceArea y1={37.5} y2={62.5} fill="#facc15" fillOpacity={0.035} />
          <ReferenceArea y1={62.5} y2={100} fill="#f87171" fillOpacity={0.035} />
          <XAxis dataKey="fecha" tickFormatter={(value) => formatDate(value, { day: '2-digit', month: 'short' })} stroke="#789089" tickLine={false} axisLine={false} minTickGap={22} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} stroke="#789089" tickLine={false} axisLine={false} />
          <Tooltip content={<HistoryTooltip />} />
          <Line type="monotone" dataKey="indice" stroke="#2dd4bf" strokeWidth={2.5} dot={{ r: 3, fill: '#071a17', stroke: '#2dd4bf', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#2dd4bf' }} isAnimationActive animationDuration={700} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function HistoryTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: HistoryPoint }> }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return <div className="chart-tooltip"><strong>{formatDate(point.fecha)}</strong><span>Índice {point.indice.toFixed(2)}</span><small>{point.categoria}</small></div>
}
