import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/lib/db', () => {
  return {
    getUsers: vi.fn(),
  }
})

import { hashPassword, verifyPassword } from '../src/lib/auth'
import { getUsers } from '../src/lib/db'

describe('hashPassword', () => {
  it('generates consistent hashes for the same input', () => {
    const first = hashPassword('secret')
    const second = hashPassword('secret')
    expect(first).toBe(second)
  })

  it('produces different hashes for different input', () => {
    const first = hashPassword('secret')
    const second = hashPassword('another')
    expect(first).not.toBe(second)
  })
})

describe('verifyPassword', () => {
  it('returns true for correct credentials', async () => {
    vi.mocked(getUsers).mockResolvedValue([
      { id: '1', username: 'alice', passwordHash: hashPassword('pw'), createdAt: '' },
    ])
    const result = await verifyPassword('alice', 'pw')
    expect(result).toBe(true)
  })

  it('returns false for incorrect credentials', async () => {
    vi.mocked(getUsers).mockResolvedValue([
      { id: '1', username: 'alice', passwordHash: hashPassword('pw'), createdAt: '' },
    ])
    const result = await verifyPassword('alice', 'wrong')
    expect(result).toBe(false)
  })
})
