import { ArrowRight, Binary, Braces, Database, GitMerge, Layers3, Scale, Sigma, Target } from 'lucide-react'
import { TERM_LABELS, VARIABLES } from '../app/constants'
import { useAppContext } from '../app/AppContext'
import { PageHeader } from '../components/common/PageHeader'

const methodologySteps = [
  { Icon: Database, index: '01', title: 'Datos', text: 'Cuatro valores diarios provenientes del usuario o de ERA5 y ERA5-Land.' },
  { Icon: Layers3, index: '02', title: 'Fuzzificación', text: 'Cada valor numérico se traduce a grados entre 0 y 1 en conjuntos lingüísticos.' },
  { Icon: GitMerge, index: '03', title: 'Inferencia Mamdani', text: 'Las reglas SI-ENTONCES se activan usando el operador mínimo.' },
  { Icon: Sigma, index: '04', title: 'Agregación', text: 'Los consecuentes recortados se reúnen en una sola figura usando máximo.' },
  { Icon: Target, index: '05', title: 'Defuzzificación', text: 'El centroide de la figura produce un índice preciso entre 0 y 100.' },
  { Icon: Scale, index: '06', title: 'Resultado', text: 'El índice se interpreta como categoría y recomendación preventiva.' },
]

export function MethodologyPage() {
  const { model } = useAppContext()
  return (
    <div className="max-w-7xl mx-auto pb-12">
      <PageHeader
        eyebrow="Modelo transparente • versión 1.1.0"
        title="Arquitectura de Inferencia Difusa"
        description="Conoce el motor matemático diseñado para evaluar el nivel de preparación preventiva en Chachapoyas, Amazonas."
        action={
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
            <Braces size={16} /> {model?.total_reglas ?? 192} Reglas
          </div>
        }
      />

      <section className="bg-white rounded-3xl p-8 lg:p-12 border border-gray-100 shadow-sm mb-12">
        <div className="max-w-3xl mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-2">Paso a paso</span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">El pipeline de evaluación Mamdani</h2>
          <p className="text-gray-500 mt-4 leading-relaxed">
            Nuestro sistema no es una «caja negra». Utiliza lógica difusa para replicar el razonamiento de un experto forestal, 
            permitiendo que las variables tengan grados de verdad en lugar de simples estados binarios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {methodologySteps.map((step) => (
            <article key={step.index} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 text-gray-900 group-hover:scale-150 transition-transform duration-700">
                <step.Icon size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 shadow-sm flex items-center justify-center">
                    <step.Icon size={24} strokeWidth={2.5} />
                  </div>
                  <span className="text-3xl font-black text-gray-200">{step.index}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-2">Entradas al sistema</span>
            <h2 className="text-2xl font-bold text-gray-900">Variables Lingüísticas</h2>
            <p className="text-gray-500 mt-3 text-sm leading-relaxed">
              Las cuatro variables climáticas se mapean a los siguientes conjuntos utilizando funciones de pertenencia trapezoidales y triangulares ajustadas al ecosistema local.
            </p>
          </div>
          
          <div className="space-y-4 flex-1">
            {model?.entradas ? model.entradas.map((variable) => {
              const iconInfo = VARIABLES.find(v => v.key === variable.nombre)
              const Icon = iconInfo?.Icon ?? Database
              return (
              <div key={variable.nombre} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{variable.nombre_visible}</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {variable.etiquetas.map((term) => (
                      <span key={term.nombre} className="text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-md">
                        {TERM_LABELS[term.nombre] ?? term.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              )
            }) : (
              <div className="text-sm text-gray-400">Cargando variables...</div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-2">Motor de Inferencia</span>
              <h2 className="text-2xl font-bold text-gray-900">Base de Conocimiento</h2>
              <p className="text-gray-500 mt-3 text-sm leading-relaxed">
                El conocimiento experto se encapsuló en {model?.total_reglas ?? 192} reglas probabilísticas que cubren todas las combinaciones posibles.
              </p>
            </div>
            <div className="shrink-0 w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Binary size={32} />
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-2xl p-5 overflow-hidden flex-1 flex flex-col">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-3">
              <Database size={14} /> Información del modelo
            </div>
            <div className="overflow-auto flex-1 custom-scrollbar">
              <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed">
                {model ? JSON.stringify({
                  id: model.model_id,
                  version: model.version,
                  tipo: model.tipo,
                  reglas_totales: model.total_reglas,
                  operadores: model.operadores,
                  fuente_datos: model.fuente_datos,
                }, null, 2) : 'Cargando conocimiento base...'}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
