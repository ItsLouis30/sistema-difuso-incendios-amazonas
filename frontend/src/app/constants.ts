import { CloudSun, Droplets, Sprout, Wind, type LucideIcon } from 'lucide-react'
import type { CategoryCode, InferenceRequest } from '../types/api'

export type InputKey = keyof InferenceRequest

export interface VariableInfo {
  key: InputKey
  shortLabel: string
  label: string
  unit: string
  minimum: number
  maximum: number
  step: number
  explanation: string
  influence: string
  Icon: LucideIcon
}

export const VARIABLES: VariableInfo[] = [
  {
    key: 'hr_min_pct',
    shortLabel: 'HR mínima',
    label: 'Humedad relativa mínima',
    unit: '%',
    minimum: 0,
    maximum: 100,
    step: 1,
    explanation: 'La menor humedad del aire registrada durante el día.',
    influence: 'Un aire más seco favorece la pérdida de humedad de la vegetación.',
    Icon: Droplets,
  },
  {
    key: 'dias_secos',
    shortLabel: 'Días secos',
    label: 'Días secos consecutivos',
    unit: 'días',
    minimum: 0,
    maximum: 15,
    step: 1,
    explanation: 'Racha de días con precipitación diaria menor a 1 mm.',
    influence: 'Una racha prolongada indica acumulación de condiciones secas.',
    Icon: CloudSun,
  },
  {
    key: 'viento_max_ms',
    shortLabel: 'Viento máximo',
    label: 'Viento máximo diario',
    unit: 'm/s',
    minimum: 0,
    maximum: 6,
    step: 0.05,
    explanation: 'Mayor velocidad diaria modelada del viento a 10 metros.',
    influence: 'El viento puede acelerar la propagación si existe un incendio.',
    Icon: Wind,
  },
  {
    key: 'humedad_suelo_superficial_m3m3',
    shortLabel: 'Humedad del suelo',
    label: 'Humedad superficial del suelo',
    unit: 'm³/m³',
    minimum: 0,
    maximum: 1,
    step: 0.001,
    explanation: 'Proporción de agua modelada en los primeros 7 cm del suelo.',
    influence: 'Un suelo más seco refuerza la señal de déficit hídrico ambiental.',
    Icon: Sprout,
  },
]

export const DEFAULT_INPUTS: InferenceRequest = {
  hr_min_pct: 59,
  dias_secos: 3,
  viento_max_ms: 2.7,
  humedad_suelo_superficial_m3m3: 0.354,
}

export const CATEGORY_META: Record<
  CategoryCode,
  { label: string; color: string; className: string }
> = {
  muy_bajo: { label: 'Muy bajo', color: '#22c55e', className: 'level-very-low' },
  bajo: { label: 'Bajo', color: '#84cc16', className: 'level-low' },
  moderado: { label: 'Moderado', color: '#eab308', className: 'level-moderate' },
  alto: { label: 'Alto', color: '#f97316', className: 'level-high' },
  muy_alto: { label: 'Muy alto', color: '#dc2626', className: 'level-very-high' },
}

export const CATEGORY_MEANINGS: Record<CategoryCode, string> = {
  muy_bajo:
    'La combinación evaluada presenta señales mínimas de preparación preventiva. Corresponde mantener la observación rutinaria de las condiciones.',
  bajo:
    'La combinación evaluada presenta señales limitadas de preparación preventiva. Conviene mantener vigilancia básica y revisar cambios relevantes.',
  moderado:
    'La combinación evaluada presenta señales intermedias de preparación preventiva. Conviene reforzar la vigilancia y tener recursos disponibles si las condiciones empeoran.',
  alto:
    'La combinación evaluada presenta señales marcadas de preparación preventiva. Se requiere vigilancia reforzada y mayor disponibilidad de recursos.',
  muy_alto:
    'La combinación evaluada presenta señales muy marcadas de preparación preventiva. Corresponde sostener el nivel máximo de preparación contemplado por la organización.',
}

export const CATEGORY_SUMMARIES: Record<CategoryCode, string> = {
  muy_bajo: 'Vigilancia preventiva básica',
  bajo: 'Vigilancia preventiva reforzada',
  moderado: 'Preparación preventiva intermedia',
  alto: 'Preparación preventiva elevada',
  muy_alto: 'Máxima preparación preventiva',
}

export const TERM_LABELS: Record<string, string> = {
  muy_baja: 'Muy baja',
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  cortos: 'Cortos',
  moderados: 'Moderados',
  prolongados: 'Prolongados',
  extremos: 'Extremos',
  muy_bajo: 'Muy bajo',
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  seca: 'Seca',
  intermedia: 'Intermedia',
  humeda: 'Húmeda',
  moderado: 'Moderado',
  muy_alto: 'Muy alto',
}

export const PIPELINE = [
  'Valores crisp',
  'Fuzzificación',
  'Reglas Mamdani',
  'Agregación',
  'Centroide',
  'Índice',
  'Categoría',
]

