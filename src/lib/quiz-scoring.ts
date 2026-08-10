export interface ScorableQuestion {
  correctIndex: number
}

export interface LockedAnswer {
  questionIndex: number
  selectedIndex: number | null
}

export function scoreQuiz(
  questions: ScorableQuestion[],
  answers: LockedAnswer[]
) {
  const answerMap = new Map(answers.map((answer) => [answer.questionIndex, answer]))
  const correct = questions.reduce((total, question, index) => {
    return total + (answerMap.get(index)?.selectedIndex === question.correctIndex ? 1 : 0)
  }, 0)
  const total = questions.length
  return {
    correct,
    total,
    xpGain: correct * 10 + (total > 0 && correct === total ? 20 : 0),
  }
}
