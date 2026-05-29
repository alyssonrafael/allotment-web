import { describe, expect, it } from 'vitest'
import {
  roundCoord,
  roundCount,
  roundDim,
  sanitizeParseEvent,
  sanitizeParseVenue,
} from './aiSanitize'
import type { ParseEventResponse, ParseVenueResponse } from '#/types'

describe('arredondamento de números', () => {
  it('arredonda para o inteiro mais próximo (4.3 → 4, 4.6 → 5)', () => {
    expect(roundDim(4.3)).toBe(4)
    expect(roundDim(4.6)).toBe(5)
    expect(roundCount(4.3)).toBe(4)
    expect(roundCount(4.6)).toBe(5)
    expect(roundCoord(4.3)).toBe(4)
    expect(roundCoord(4.6)).toBe(5)
  })

  it('dimensão tem mínimo 1; count/coord têm mínimo 0', () => {
    expect(roundDim(0.2)).toBe(1)
    expect(roundDim(0)).toBe(1)
    expect(roundCount(-0.4)).toBe(0)
    expect(roundCoord(-0.4)).toBe(0)
  })
})

describe('sanitizeParseEvent', () => {
  const complete: ParseEventResponse = {
    status: 'complete',
    event: {
      name: 'Feira',
      type: 'FEIRA',
      startDate: '2026-05-10T00:00:00.000Z',
      endDate: '2026-05-15T00:00:00.000Z',
      canvasWidth: 50.4,
      canvasHeight: 30.6,
    },
    allotments: [
      {
        code: 'A1',
        name: 'Stand A1',
        x: 2.3,
        y: 4.6,
        width: 2.5,
        height: 3.1,
        status: 'AVAILABLE',
        price: 6249.7,
      },
    ],
    summary: {
      total: 10.4,
      placed: 9.6,
      discarded: 0.8,
      groups: [{ width: 2.5, height: 3.1, count: 4.6, placed: 4.3 }],
    },
    warnings: [],
    missing: [],
  }

  it('arredonda event, allotments e summary para inteiros', () => {
    const r = sanitizeParseEvent(complete)
    if (r.status !== 'complete') throw new Error('esperado complete')
    expect(r.event.canvasWidth).toBe(50)
    expect(r.event.canvasHeight).toBe(31)
    expect(r.allotments[0]).toMatchObject({ x: 2, y: 5, width: 3, height: 3, price: 6250 })
    expect(r.summary).toMatchObject({ total: 10, placed: 10, discarded: 1 })
    expect(r.summary.groups[0]).toEqual({ width: 3, height: 3, count: 5, placed: 4 })
  })

  it('não mexe em needs_info', () => {
    const needsInfo: ParseEventResponse = {
      status: 'needs_info',
      questions: ['Quando?'],
      collected: { name: 'Feira' },
      assistantMessage: 'Quando será o evento?',
    }
    expect(sanitizeParseEvent(needsInfo)).toBe(needsInfo)
  })
})

describe('sanitizeParseVenue', () => {
  it('arredonda venue e suggestedEvent', () => {
    const res: ParseVenueResponse = {
      status: 'complete',
      venue: {
        name: 'Pavilhão',
        description: null,
        width: 80.4,
        height: 40.6,
        city: 'SP',
        state: 'SP',
        street: null,
        neighborhood: null,
        zipCode: null,
        accent: '#000',
        photo: '',
      },
      suggestedEvent: {
        name: 'Evento',
        type: 'FEIRA',
        startDate: '2026-05-10T00:00:00.000Z',
        endDate: '2026-05-15T00:00:00.000Z',
        canvasWidth: 80.4,
        canvasHeight: 40.6,
      },
      confidence: 0.9,
      missing: [],
    }
    const r = sanitizeParseVenue(res)
    if (r.status !== 'complete') throw new Error('esperado complete')
    expect(r.venue).toMatchObject({ width: 80, height: 41 })
    expect(r.suggestedEvent).toMatchObject({ canvasWidth: 80, canvasHeight: 41 })
  })
})
