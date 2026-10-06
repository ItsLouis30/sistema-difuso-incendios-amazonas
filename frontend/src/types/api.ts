export type CategoryCode = 'muy_bajo' | 'bajo' | 'moderado' | 'alto' | 'muy_alto'

export interface InferenceRequest {
  hr_min_pct: number
  dias_secos: number
  viento_max_ms: number
  humedad_suelo_superficial_m3m3: number
}

export interface InferenceInputs extends InferenceRequest {}

export interface ActiveRule {
  numero: number
  antecedentes: Record<string, string>
  consecuente: CategoryCode
  activacion: number
}

export interface CurvePoint {
  x: number
  pertenencia: number
}

export interface HistoricalRecord {
  fecha: string
  pp_mm: number
  hr_min_pct: number
  viento_medio_ms: number
  viento_max_ms: number
  dias_secos: number
  humedad_suelo_superficial_m3m3: number
}

export interface InferenceResponse {
  model_id: string
  model_version: string
  modo: 'manual' | 'historical'
  entradas: InferenceInputs
  resultado: {
    indice: number
    categoria: string
    codigo_categoria: CategoryCode
    recomendacion: string
  }
  pertenencias_entrada: Record<string, Record<string, number>>
  pertenencias_salida: Record<CategoryCode, number>
  reglas_activas: ActiveRule[]
  curva_salida: CurvePoint[]
  fuente:
    | { tipo: 'manual' }
    | {
        tipo: 'historical'
        fecha: string
        dataset: string
        dentro_periodo_calibracion: boolean
        nota_interpretacion: string
        registro: HistoricalRecord
      }
}

export interface MembershipTerm {
  nombre: string
  puntos: [number, number, number, number]
}

export interface LinguisticVariable {
  nombre: string
  nombre_visible: string
  unidad: string
  universo: [number, number]
  etiquetas: MembershipTerm[]
}

export interface ModelResponse {
  model_id: string
  version: string
  tipo: string
  operadores: {
    and_operator: string
    implicacion: string
    agregacion: string
    defuzzificacion: string
  }
  entradas: LinguisticVariable[]
  salida: LinguisticVariable
  total_reglas: number
  fuente_datos: {
    variables_atmosfericas: string
    humedad_suelo: string
    ubicacion: string
    periodo: string
    observacion: string
  }
}

export interface HistoryRange {
  fecha_inicial: string
  fecha_final: string
  total_registros: number
  frecuencia: string
  zona_horaria: string
}

export interface ApiErrorBody {
  error?: {
    code?: string
    message?: string
    details?: Array<{ field?: string; message?: string }>
  }
}

export interface HistoryPoint {
  fecha: string
  indice: number
  categoria: string
  codigo: CategoryCode
}
