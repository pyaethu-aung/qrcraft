import { describe, it, expect } from 'vitest'
import { mapWithConcurrency } from '../concurrency'

describe('mapWithConcurrency', () => {
  it('returns results in input order regardless of completion order', async () => {
    const delays = [30, 10, 20, 0]
    const result = await mapWithConcurrency(delays, 4, (delay, i) =>
      new Promise<number>((resolve) => setTimeout(() => resolve(i), delay)),
    )
    expect(result).toEqual([0, 1, 2, 3])
  })

  it('never runs more than `concurrency` tasks at once', async () => {
    let active = 0
    let maxActive = 0
    const items = Array.from({ length: 10 }, (_, i) => i)

    await mapWithConcurrency(items, 3, async (item) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 5))
      active -= 1
      return item * 2
    })

    expect(maxActive).toBeLessThanOrEqual(3)
  })

  it('handles an empty list', async () => {
    const result = await mapWithConcurrency([], 4, (item) => Promise.resolve(item))
    expect(result).toEqual([])
  })

  it('handles concurrency greater than the item count', async () => {
    const result = await mapWithConcurrency([1, 2], 10, (item) => Promise.resolve(item * 10))
    expect(result).toEqual([10, 20])
  })

  it('propagates a task error', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, (item) =>
        item === 2 ? Promise.reject(new Error('boom')) : Promise.resolve(item),
      ),
    ).rejects.toThrow('boom')
  })
})
