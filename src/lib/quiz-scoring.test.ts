import { describe, expect, it } from 'vitest'
import { scoreQuiz } from './quiz-scoring'

describe('scoreQuiz', () => {
  const questions = [{ correctIndex: 1 }, { correctIndex: 0 }, { correctIndex: 3 }]

  it('scores locked server answers', () => {
    expect(scoreQuiz(questions, [
      { questionIndex: 0, selectedIndex: 1 },
      { questionIndex: 1, selectedIndex: 2 },
      { questionIndex: 2, selectedIndex: null },
    ])).toEqual({ correct: 1, total: 3, xpGain: 10 })
  })

  it('adds the perfect-score bonus', () => {
    expect(scoreQuiz(questions, [
      { questionIndex: 0, selectedIndex: 1 },
      { questionIndex: 1, selectedIndex: 0 },
      { questionIndex: 2, selectedIndex: 3 },
    ])).toEqual({ correct: 3, total: 3, xpGain: 50 })
  })

  it('does not award a perfect bonus for an empty quiz', () => {
    expect(scoreQuiz([], [])).toEqual({ correct: 0, total: 0, xpGain: 0 })
  })
})
