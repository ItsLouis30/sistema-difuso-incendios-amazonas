import { useAppContext } from '../../app/AppContext'
import { VARIABLES, type InputKey } from '../../app/constants'
import type { InferenceRequest, InferenceResponse } from '../../types/api'
import {
  AggregatedCurveCard,
  DryDaysCard,
  EmptyResultCard,
  InferenceStepsCard,
  OutputMembershipCard,
  PipelineStrip,
  ResultExplanationCard,
  ResultHeroCard,
  RulesCard,
} from './ResultCards'
import { VariableCard } from './VariableCard'

/** Tablero compartido por la evaluación manual y la histórica: el resultado primero, luego su explicación. */
export function InferenceDashboard({ inputs, result, onInputChange, pipeline }: {
  inputs: InferenceRequest | null
  result: InferenceResponse | null
  onInputChange?: (key: InputKey, value: number) => void
  pipeline?: { step: number; running: boolean } | null
}) {
  const { model } = useAppContext()
  const totalRules = model?.total_reglas ?? 192
  const running = pipeline?.running ?? false
  const ready = Boolean(result) && !running

  return (
    <div className="flex flex-col gap-4 px-4 pb-7 pt-5 md:px-6">
      <div className="flex flex-wrap gap-4">
        {ready && result && (
          <div className="min-w-0 flex-[1_1_380px]">
            <ResultHeroCard result={result} />
          </div>
        )}
        {inputs && (
          <div className="grid min-w-0 flex-[2_1_560px] grid-cols-1 sm:grid-cols-2 gap-4">
            {VARIABLES.map((variable) => (
              <VariableCard
                key={variable.key}
                info={variable}
                value={inputs[variable.key]}
                memberships={running ? undefined : result?.pertenencias_entrada[variable.key]}
                onChange={onInputChange ? (value) => onInputChange(variable.key, value) : undefined}
                readOnly={!onInputChange}
              />
            ))}
          </div>
        )}
      </div>

      {ready && result && <ResultExplanationCard result={result} totalRules={totalRules} />}

      {pipeline && <PipelineStrip step={pipeline.step} done={!pipeline.running} />}

      {!ready || !result ? (
        <EmptyResultCard
          message={running ? 'Calculando pertenencias, reglas y centroide…' : 'Ejecuta una evaluación para ver el índice, sus reglas y la explicación.'}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-4 [&>*]:min-w-0">
            <div className="flex-[2_1_520px] [&>*]:h-full"><AggregatedCurveCard result={result} /></div>
            <div className="flex-[1_1_300px] [&>*]:h-full"><OutputMembershipCard result={result} /></div>
            <div className="flex-[0_1_220px] [&>*]:h-full"><DryDaysCard result={result} /></div>
          </div>
          <div className="flex flex-wrap gap-4 [&>*]:min-w-0">
            <div className="flex-[2_1_520px] [&>*]:h-full"><RulesCard result={result} totalRules={totalRules} /></div>
            <div className="flex-[1_1_320px] [&>*]:h-full"><InferenceStepsCard result={result} totalRules={totalRules} /></div>
          </div>
        </>
      )}
    </div>
  )
}
