import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CurvePoint } from '../../types/api'

const EMBER = '#b8441d'
const INK = '#161514'

export function OutputCurveChart({ data, centroid }: { data: CurvePoint[]; centroid: number }) {
  return (
    <div className="h-full w-full" aria-label="Curva difusa agregada de salida">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 18, right: 6, left: 6, bottom: 0 }}>
          <defs>
            <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EMBER} stopOpacity={0.25} />
              <stop offset="100%" stopColor={EMBER} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="x"
            type="number"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            stroke="#66625e"
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis domain={[0, 1]} hide />
          <Tooltip content={<CurveTooltip />} cursor={{ stroke: '#d4d4d4' }} />
          <Area
            type="monotone"
            dataKey="pertenencia"
            stroke={EMBER}
            strokeWidth={1.8}
            fill="url(#curveFill)"
            isAnimationActive
            animationDuration={700}
          />
          <ReferenceLine
            x={centroid}
            stroke={INK}
            strokeDasharray="3 4"
            label={{ value: `centroide ${centroid.toFixed(2)}`, fill: INK, fontSize: 12, fontWeight: 600, position: 'top' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function CurveTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: number }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl bg-ink px-3 py-2 text-xs text-white">
      <strong className="block font-medium">Índice {label}</strong>
      <span className="text-[#bdbdbd]">μ = {payload[0].value.toFixed(3)}</span>
    </div>
  )
}
