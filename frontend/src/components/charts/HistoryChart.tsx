import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceArea } from 'recharts'
import { formatDate } from '../../app/format'
import type { HistoryPoint } from '../../types/api'

export function HistoryChart({ data }: { data: HistoryPoint[] }) {
  return (
    <div className="w-full h-full relative" aria-label="Evolución histórica del índice preventivo">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, left: -18, bottom: 2 }}>
          <CartesianGrid stroke="#f3f4f6" vertical={false} />
          <ReferenceArea y1={0} y2={37.5} fill="#4ade80" fillOpacity={0.05} />
          <ReferenceArea y1={37.5} y2={62.5} fill="#facc15" fillOpacity={0.05} />
          <ReferenceArea y1={62.5} y2={100} fill="#f87171" fillOpacity={0.05} />
          <XAxis dataKey="fecha" tickFormatter={(value) => formatDate(value, { day: '2-digit', month: 'short' })} stroke="#9ca3af" tickLine={false} axisLine={false} minTickGap={22} fontSize={12} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} stroke="#9ca3af" tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip content={<HistoryTooltip />} />
          <Line type="monotone" dataKey="indice" stroke="#059669" strokeWidth={2.5} dot={{ r: 3, fill: '#fff', stroke: '#059669', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#059669' }} isAnimationActive animationDuration={700} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function HistoryTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: HistoryPoint }> }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-sm">
      <strong className="block text-gray-900 mb-1">{formatDate(point.fecha)}</strong>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-500">Índice</span>
        <strong className="text-gray-900">{point.indice.toFixed(2)}</strong>
      </div>
      <small className="text-xs font-bold text-emerald-600 block bg-emerald-50 px-2 py-1 rounded-md w-fit">
        {point.categoria}
      </small>
    </div>
  )
}
