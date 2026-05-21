import { describe, it, expect } from 'vitest'
import { ruleTriage } from './triage'

describe('ruleTriage', () => {
  it('flags outages as urgent', () => {
    expect(ruleTriage('Server outage in the warehouse', '').priority).toBe('URGENT')
  })

  it('flags security issues as urgent', () => {
    expect(ruleTriage('Security breach on the network', '').priority).toBe('URGENT')
  })

  it('treats invoices and deadlines as high', () => {
    expect(ruleTriage('Invoice deadline is tomorrow', '').priority).toBe('HIGH')
  })

  it('defaults to medium when no signals', () => {
    expect(ruleTriage('Update the team handbook', '').priority).toBe('MEDIUM')
  })

  it('maps IT keywords', () => {
    expect(ruleTriage('VPN broken on my laptop', '').category).toBe('IT')
  })

  it('maps facilities keywords', () => {
    expect(ruleTriage('Projector broken in the meeting room', '').category).toBe('FACILITIES')
  })

  it('falls back to OTHER category', () => {
    expect(ruleTriage('Plan the summer picnic', '').category).toBe('OTHER')
  })

  it('always reports rules as the source', () => {
    expect(ruleTriage('anything', '').source).toBe('rules')
  })
})
