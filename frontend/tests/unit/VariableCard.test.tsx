import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VARIABLES } from '../../src/app/constants'
import { VariableCard } from '../../src/features/dashboard/VariableCard'

describe('VariableCard', () => {
  it('explains the variable and exposes active memberships', () => {
    render(
      <VariableCard
        info={VARIABLES[0]}
        value={35}
        memberships={{ baja: 0.75, media: 0.25, alta: 0 }}
        readOnly
      />,
    )

    expect(screen.getByText('Humedad relativa mínima')).toBeInTheDocument()
    expect(screen.getByText(/La menor humedad del aire/)).toBeInTheDocument()
    expect(screen.getAllByText(/Baja/)).toHaveLength(2)
    expect(screen.getByText('0.75')).toBeInTheDocument()
  })

  it('reports changes from the slider', () => {
    const onChange = vi.fn()
    render(<VariableCard info={VARIABLES[2]} value={2.7} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Deslizador de Viento máximo diario'), { target: { value: '4.2' } })
    expect(onChange).toHaveBeenCalledWith(4.2)
  })
})
