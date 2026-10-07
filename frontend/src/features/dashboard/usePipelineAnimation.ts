import { useCallback, useEffect, useRef, useState } from 'react'
import { PIPELINE } from '../../app/constants'

const STEP_MS = 180

/** Anima el recorrido del pipeline una vez que el backend ya devolvió el resultado. */
export function usePipelineAnimation() {
  const [pipeline, setPipeline] = useState<{ step: number; running: boolean } | null>(null)
  const timer = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
  }, [])

  const start = useCallback(() => {
    stop()
    setPipeline({ step: 0, running: true })
  }, [stop])

  const play = useCallback(() => {
    stop()
    let step = 0
    timer.current = window.setInterval(() => {
      step += 1
      const finished = step >= PIPELINE.length
      setPipeline({ step, running: !finished })
      if (finished) stop()
    }, STEP_MS)
  }, [stop])

  const reset = useCallback(() => {
    stop()
    setPipeline(null)
  }, [stop])

  useEffect(() => stop, [stop])
  return { pipeline, start, play, reset }
}
