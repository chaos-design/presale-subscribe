export function splitMetric(total: number, weights: number[]) {
  if (weights.length === 0) {
    return []
  }

  const target = Math.max(0, Math.round(total))
  const normalizedWeights = weights.map((weight) =>
    Number.isFinite(weight) ? Math.max(0, weight) : 0
  )
  const weightTotal = normalizedWeights.reduce((sum, weight) => sum + weight, 0)

  if (target === 0 || weightTotal === 0) {
    return weights.map(() => 0)
  }

  const exactValues = normalizedWeights.map((weight) => (target * weight) / weightTotal)
  const values = exactValues.map(Math.floor)
  const remaining = target - values.reduce((sum, value) => sum + value, 0)
  const remainderOrder = exactValues
    .map((value, index) => ({ index, remainder: value - values[index] }))
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index)

  for (let index = 0; index < remaining; index += 1) {
    const targetIndex = remainderOrder[index]?.index
    if (targetIndex !== undefined) {
      values[targetIndex] += 1
    }
  }

  return values
}
