import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CurvePoint } from '../../types/api'

export function OutputCurveChart({ data, centroid, color }: {
  data: CurvePoint[]
  centroid: number
  color: string
}) {
  return (
    <div className="chart-frame output-chart" aria-label="Curva difusa agregada de salida">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 14, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="95%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(168,188,181,.1)" vertical={false} />
          <XAxis dataKey="x" type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} stroke="#789089" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 1]} ticks={[0, 0.5, 1]} stroke="#789089" tickLine={false} axisLine={false} />
          <Tooltip content={<CurveTooltip />} />
          <Area type="monotone" dataKey="pertenencia" stroke={color} strokeWidth={2.2} fill="url(#curveFill)" isAnimationActive animationDuration={700} />
          <ReferenceLine x={centroid} stroke="#f2f7f4" strokeDasharray="4 4" label={{ value: `Centroide ${centroid}`, fill: '#f2f7f4', fontSize: 11, position: 'insideTopRight' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function CurveTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: number }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><strong>Índice {label}</strong><span>μ = {payload[0].value.toFixed(3)}</span></div>
}
