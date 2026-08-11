'use client'

import { useEffect } from 'react'

export function CardGlowController() {
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!finePointer.matches) return

    const interactiveSelector = [
      'a',
      'button',
      'input',
      'textarea',
      'select',
      '[role="button"]',
      '[role="option"]',
      '[role="textbox"]',
      '[contenteditable="true"]',
      '[data-no-card-glow]',
    ].join(',')

    let frame = 0
    let activeCard: HTMLElement | null = null
    let pointerX = 0
    let pointerY = 0

    const clearActiveCard = () => {
      activeCard?.removeAttribute('data-card-glow-active')
      activeCard = null
    }

    const paint = () => {
      frame = 0
      if (!activeCard) return
      const rect = activeCard.getBoundingClientRect()
      activeCard.style.setProperty('--card-glow-x', `${pointerX - rect.left}px`)
      activeCard.style.setProperty('--card-glow-y', `${pointerY - rect.top}px`)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) {
        clearActiveCard()
        return
      }

      const card = target.closest<HTMLElement>('.ambient-card')
      const interactiveElement = target.closest(interactiveSelector)
      if (
        !card ||
        card.matches(':focus-within') ||
        (interactiveElement && card.contains(interactiveElement))
      ) {
        clearActiveCard()
        return
      }

      if (activeCard !== card) {
        clearActiveCard()
        card.setAttribute('data-card-glow-active', 'true')
      }
      activeCard = card
      pointerX = event.clientX
      pointerY = event.clientY
      if (!frame) frame = window.requestAnimationFrame(paint)
    }

    document.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      if (frame) window.cancelAnimationFrame(frame)
      clearActiveCard()
    }
  }, [])

  return null
}
