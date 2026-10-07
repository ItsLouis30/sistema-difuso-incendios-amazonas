import { Binary, BookOpen, CloudRain, Database, GitMerge, Layers3, Satellite, Scale, Sigma, Target } from 'lucide-react'
import { TERM_LABELS, VARIABLES } from '../app/constants'
import { useAppContext } from '../app/AppContext'
import { Card, CardTitle, HeroBand, IconCircle, Pill } from '../components/common/Bento'

const methodologySteps = [
  { Icon: Database, index: '01', title: 'Datos', text: 'Cuatro valores diarios provenientes del usuario o de ERA5 y ERA5-Land.' },
  { Icon: Layers3, index: '02', title: 'Fuzzificación', text: 'Cada valor numérico se traduce a grados entre 0 y 1 en conjuntos lingüísticos.' },
  { Icon: GitMerge, index: '03', title: 'Inferencia Mamdani', text: 'Las reglas SI-ENTONCES se activan usando el operador mínimo.' },
  { Icon: Sigma, index: '04', title: 'Agregación', text: 'Los consecuentes recortados se reúnen en una sola figura usando máximo.' },
  { Icon: Target, index: '05', title: 'Defuzzificación', text: 'El centroide de la figura produce un índice preciso entre 0 y 100.' },
  { Icon: Scale, index: '06', title: 'Resultado', text: 'El índice se interpreta como categoría y recomendación preventiva.' },
]

const sources = [
  {
    Icon: Satellite,
    title: 'ERA5 y ERA5-Land',
    text: 'Las variables atmosféricas proceden de ERA5 y la humedad superficial del suelo de ERA5-Land, consultadas mediante Open-Meteo para celdas próximas a Chachapoyas. Son datos de reanálisis, no mediciones directas de la estación.',
  },
  {
    Icon: CloudRain,
    title: 'Serie diaria preparada',
    text: 'El dataset integra precipitación, HR mínima, viento máximo y humedad del suelo entre 2000 y 2025. Los días secos se calculan de forma determinista usando precipitación menor a 1 mm y sin convertir faltantes en cero.',
  },
  {
    Icon: BookOpen,
    title: 'Diseño académico auditable',
    text: 'Las funciones se calibraron con la distribución estacional de la serie y la base de 192 reglas es una heurística académica monotónica. El proyecto no afirma validación con incendios observados ni revisión experta.',
  },
]

export function MethodologyPage() {
  const { model } = useAppContext()
  return (
    <>
      <HeroBand
        left={
          <>
            <Pill tone="dark" className="px-4! py-2! text-sm!">Modelo v{model?.version ?? '1.1.0'}</Pill>
            <Pill className="px-4! py-2! text-sm!">{model?.total_reglas ?? 192} reglas</Pill>
            <Pill className="px-4! py-2! text-sm!">Mamdani · mín–mín–máx · centroide</Pill>
          </>
        }
        title="Así razona el sistema."
        subtitle="Un modelo transparente, paso a paso."
      />

      <div className="grid grid-cols-1 gap-4 px-4 pb-6 pt-4 md:grid-cols-2 md:px-6 xl:grid-cols-12">
        <Card className="md:col-span-2 xl:col-span-12">
          <CardTitle
            title="El pipeline de evaluación Mamdani"
            caption="Utiliza lógica difusa para representar relaciones graduales: las variables tienen grados de pertenencia en lugar de estados binarios."
          />
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {methodologySteps.map((step) => (
              <article key={step.index} className="flex flex-col gap-4 rounded-3xl border border-line p-4">
                <div className="flex items-center justify-between">
                  <IconCircle dark={step.index === '05'}>
                    <step.Icon size={16} />
                  </IconCircle>
                  <span className="text-xs font-medium tabular-nums text-muted">{step.index}</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 xl:col-span-7">
          <CardTitle
            title="Variables lingüísticas"
            caption="Las cuatro variables climáticas se mapean a conjuntos difusos con funciones de pertenencia trapezoidales y triangulares."
          />
          <div className="space-y-2">
            {model?.entradas ? model.entradas.map((variable) => {
              const Icon = VARIABLES.find((item) => item.key === variable.nombre)?.Icon ?? Database
              return (
                <div key={variable.nombre} className="flex gap-3 rounded-3xl border border-line p-3">
                  <IconCircle>
                    <Icon size={16} />
                  </IconCircle>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium">{variable.nombre_visible}</h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {variable.etiquetas.map((term) => (
                        <Pill key={term.nombre}>{TERM_LABELS[term.nombre] ?? term.nombre}</Pill>
                      ))}
                    </div>
                  </div>
                </div>
              )
            }) : (
              <p className="text-sm text-muted">Cargando variables…</p>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 xl:col-span-5">
          <CardTitle
            title="Base de conocimiento"
            caption={`La heurística académica se organizó en ${model?.total_reglas ?? 192} reglas difusas que cubren todas las combinaciones lingüísticas posibles.`}
            action={<IconCircle dark><Binary size={16} /></IconCircle>}
          />
          <div className="flex min-h-64 flex-1 flex-col overflow-hidden rounded-3xl bg-ink p-4">
            <span className="mb-3 flex items-center gap-2 border-b border-[#2c2c2c] pb-3 text-xs text-[#9a9a9a]">
              <Database size={14} /> Información del modelo
            </span>
            <pre className="no-scrollbar flex-1 overflow-auto font-mono text-[11px] leading-relaxed text-ember-200">
              {model ? JSON.stringify({
                id: model.model_id,
                version: model.version,
                tipo: model.tipo,
                reglas_totales: model.total_reglas,
                operadores: model.operadores,
                fuente_datos: model.fuente_datos,
              }, null, 2) : 'Cargando conocimiento base…'}
            </pre>
          </div>
        </Card>

        <Card className="md:col-span-2 xl:col-span-12">
          <CardTitle
            title="Origen de los datos"
            caption="La evaluación histórica utiliza series de reanálisis documentadas y preparadas para el punto de referencia de Chachapoyas."
          />
          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {sources.map(({ Icon, title, text }) => (
              <article key={title} className="flex gap-3 rounded-3xl border border-line p-4">
                <IconCircle>
                  <Icon size={16} />
                </IconCircle>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
