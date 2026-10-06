import { ArrowRight, Binary, Braces, Database, GitMerge, Layers3, Scale, Sigma, Target } from 'lucide-react'
import { TERM_LABELS, VARIABLES } from '../app/constants'
import { useAppContext } from '../app/AppContext'
import { PageHeader } from '../components/common/PageHeader'

const methodologySteps = [
  { Icon: Database, index: '01', title: 'Datos', text: 'Cuatro valores diarios provenientes del usuario o de ERA5 y ERA5-Land.' },
  { Icon: Layers3, index: '02', title: 'Fuzzificación', text: 'Cada valor numérico se traduce a grados entre 0 y 1 en conjuntos lingüísticos.' },
  { Icon: GitMerge, index: '03', title: 'Inferencia Mamdani', text: 'Las reglas SI–ENTONCES se activan usando el operador mínimo.' },
  { Icon: Sigma, index: '04', title: 'Agregación', text: 'Los consecuentes recortados se reúnen en una sola figura usando máximo.' },
  { Icon: Target, index: '05', title: 'Defuzzificación', text: 'El centroide de la figura produce un índice preciso entre 0 y 100.' },
  { Icon: Scale, index: '06', title: 'Resultado', text: 'El índice se interpreta como categoría y recomendación preventiva.' },
]

export function MethodologyPage() {
  const { model } = useAppContext()
  return (
    <div className="methodology-page">
      <PageHeader
        eyebrow="Modelo transparente · versión 1.1.0"
        title="Cómo funciona el sistema"
        description="Una explicación visual del recorrido que siguen los datos, desde la lectura diaria hasta una recomendación preventiva comprensible."
        action={<span className="soft-badge"><Binary size={15} /> Mamdani · no Sugeno</span>}
      />

      <section className="methodology-flow card">
        {methodologySteps.map(({ Icon, index, title, text }, stepIndex) => <div className="method-step-wrap" key={title}><article className="method-step"><span className="method-index">{index}</span><div className="method-icon"><Icon size={23} /></div><h2>{title}</h2><p>{text}</p></article>{stepIndex < methodologySteps.length - 1 && <ArrowRight className="method-arrow" size={20} />}</div>)}
      </section>

      <section className="methodology-grid">
        <article className="card variables-method-card">
          <div className="card-heading"><div><span className="section-kicker">Universos de entrada</span><h2>Las cuatro variables del modelo</h2></div></div>
          <div className="method-variable-list">
            {VARIABLES.map((variable) => {
              const configured = model?.entradas.find((item) => item.nombre === variable.key)
              return <div className="method-variable" key={variable.key}><span className="variable-icon"><variable.Icon size={18} /></span><div><strong>{variable.label}</strong><p>{variable.explanation}</p><div className="term-pills">{configured?.etiquetas.map((term) => <span key={term.nombre}>{TERM_LABELS[term.nombre] ?? term.nombre}</span>) ?? <span>Cargando conjuntos…</span>}</div></div><small>{variable.minimum}–{variable.maximum} {variable.unit}</small></div>
            })}
          </div>
        </article>

        <article className="card model-facts-card">
          <span className="section-kicker">Arquitectura difusa</span>
          <h2>Conocimiento auditable</h2>
          <div className="big-rule-count"><strong>{model?.total_reglas ?? 192}</strong><span>reglas SI–ENTONCES</span></div>
          <p>Las reglas cubren todas las combinaciones de las etiquetas de HR, días secos, viento y humedad del suelo.</p>
          <div className="operator-list">
            <div><span>AND y activación</span><strong>Mínimo</strong></div>
            <div><span>Implicación</span><strong>Mínimo</strong></div>
            <div><span>Agregación</span><strong>Máximo</strong></div>
            <div><span>Defuzzificación</span><strong>Centroide</strong></div>
          </div>
        </article>
      </section>

      <section className="card rule-example">
        <div className="rule-example-icon"><Braces size={26} /></div>
        <div><span className="section-kicker">Ejemplo de razonamiento</span><h2>Una regla se lee en lenguaje natural</h2><p><strong>SI</strong> la HR es muy baja <strong>Y</strong> los días secos son extremos <strong>Y</strong> el viento es alto <strong>Y</strong> el suelo está seco, <strong>ENTONCES</strong> el nivel preventivo es muy alto.</p><small>La fuerza final de la regla es el menor grado de pertenencia entre sus cuatro antecedentes.</small></div>
      </section>

      <section className="scope-note">
        <Target size={20} /><div><strong>Alcance correcto</strong><p>El sistema apoya la preparación ante condiciones meteorológicas favorables a incendios. No predice igniciones, no crea mapas de riesgo territorial y no reemplaza decisiones institucionales.</p></div>
      </section>
    </div>
  )
}
