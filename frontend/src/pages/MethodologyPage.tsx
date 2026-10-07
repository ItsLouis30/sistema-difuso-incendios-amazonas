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
    title: 'Copernicus ERA5 & ERA5-Land',
    text: 'Proporcionado por el ECMWF (Centro Europeo de Previsiones Meteorológicas a Plazo Medio). Se utilizó para extraer datos reanalizados de humedad superficial del suelo, velocidad del viento y humedad relativa, ofreciendo una resolución espacial sin precedentes.',
  },
  {
    Icon: CloudRain,
    title: 'SENAMHI',
    text: 'El Servicio Nacional de Meteorología e Hidrología del Perú es la base principal para validar empíricamente los umbrales de precipitaciones (días secos consecutivos) y correlacionar los patrones climáticos locales en Chachapoyas.',
  },
  {
    Icon: BookOpen,
    title: 'Fundamentos del modelo difuso',
    text: 'Los conjuntos borrosos, las funciones de pertenencia y las reglas del sistema de inferencia (SI-ENTONCES) fueron extraídas y adaptadas a partir de revisiones bibliográficas de modelos preventivos forestales internacionales, ajustando el peso probabilístico mediante la distribución de frecuencias locales observadas en los últimos 20 años.',
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
            caption="Utiliza lógica difusa para replicar el razonamiento de un experto forestal: las variables tienen grados de verdad en lugar de estados binarios."
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
            caption={`El conocimiento experto se encapsuló en ${model?.total_reglas ?? 192} reglas probabilísticas que cubren todas las combinaciones posibles.`}
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
            caption="El modelado de las variables meteorológicas y la evaluación histórica se construyeron con repositorios climáticos de alta fidelidad."
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
