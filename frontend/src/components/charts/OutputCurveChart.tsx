import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CurvePoint } from '../../types/api'

export function OutputCurveChart({ data, centroid, color }: {
  data: CurvePoint[]
  centroid: number
  color: string
}) {
  return (
    <div className="w-full h-full relative" aria-label="Curva difusa agregada de salida">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 14, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="95%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="x" type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} stroke="#9ca3af" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis domain={[0, 1]} ticks={[0, 0.5, 1]} stroke="#9ca3af" tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip content={<CurveTooltip />} />
          <Area type="monotone" dataKey="pertenencia" stroke={color} strokeWidth={2.5} fill="url(#curveFill)" isAnimationActive animationDuration={700} />
          <ReferenceLine x={centroid} stroke="#374151" strokeDasharray="4 4" label={{ value: `Centroide ${centroid.toFixed(1)}`, fill: '#374151', fontSize: 12, fontWeight: 'bold', position: 'insideTopRight' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function CurveTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: number }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-sm">
      <strong className="block text-gray-900 mb-1">Índice {label}</strong>
      <span className="text-gray-500 font-medium">μ = {payload[0].value.toFixed(3)}</span>
    </div>
  )
}
