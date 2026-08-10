import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { generateQuiz } from '@/lib/ai'
import { getOrCreateUser, levelFromXp, setUserIdCookie } from '@/lib/gamify'
import { parseJsonBody, shortText } from '@/lib/request'
import { scoreQuiz } from '@/lib/quiz-scoring'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const createQuizSchema = z.object({
  topic: shortText(200),
  subject: shortText(64).default('general'),
  count: z.number().int().min(3).max(15).default(5),
  level: z.string().trim().max(64).optional(),
})

const answerSchema = z.object({
  attemptId: z.string().cuid(),
  questionIndex: z.number().int().min(0),
  selectedIndex: z.number().int().min(0).max(3).nullable(),
})

const finishSchema = z.object({ attemptId: z.string().cuid() })

const storedQuestionSchema = z.object({
  id: z.union([z.string(), z.number()]),
  question: shortText(1000),
  options: z.array(shortText(500)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: shortText(2000),
  difficulty: z.string().trim().min(1).max(32),
})

const storedAnswersSchema = z.array(
  z.object({
    questionIndex: z.number().int().min(0),
    selectedIndex: z.number().int().min(0).max(3).nullable(),
  })
)

type StoredQuestion = z.infer<typeof storedQuestionSchema>
type StoredAnswer = z.infer<typeof storedAnswersSchema>[number]

function readQuestions(value: Prisma.JsonValue): StoredQuestion[] {
  const result = z.array(storedQuestionSchema).safeParse(value)
  if (!result.success) throw new Error('Stored quiz questions are invalid')
  return result.data
}

function readAnswers(value: Prisma.JsonValue): StoredAnswer[] {
  const result = storedAnswersSchema.safeParse(value)
  if (!result.success) throw new Error('Stored quiz answers are invalid')
  return result.data
}

function publicQuestion(question: StoredQuestion) {
  return {
    id: question.id,
    question: question.question,
    options: question.options,
    difficulty: question.difficulty,
  }
}

export async function POST(request: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(request, createQuizSchema)
    if (!parsed.success) return parsed.response

    const { topic, subject, count, level } = parsed.data
    const generated = await generateQuiz(topic, count, level)
    const validated = z.array(storedQuestionSchema).length(count).safeParse(generated)
    if (!validated.success) {
      console.error('[api/quiz] invalid AI response', validated.error.issues)
      return NextResponse.json(
        { error: 'Генератор вернул некорректный квиз. Попробуйте ещё раз.' },
        { status: 502 }
      )
    }

    const attempt = await db.quizAttempt.create({
      data: {
        userId: user.id,
        subject,
        topic,
        questions: validated.data as Prisma.InputJsonValue,
        answers: [] as Prisma.InputJsonValue,
        total: validated.data.length,
      },
    })
    const res = NextResponse.json({
      attemptId: attempt.id,
      questions: validated.data.map(publicQuestion),
      topic,
      subject,
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (error) {
    console.error('[api/quiz] error', error)
    return NextResponse.json(
      { error: 'Не удалось создать квиз. Попробуйте ещё раз.' },
      { status: 500 }
    )
  }
}

/** Lock one answer and return feedback for that question. */
export async function PATCH(request: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(request, answerSchema)
    if (!parsed.success) return parsed.response
    const { attemptId, questionIndex, selectedIndex } = parsed.data

    const attempt = await db.quizAttempt.findFirst({
      where: { id: attemptId, userId: user.id },
    })
    if (!attempt) return NextResponse.json({ error: 'Квиз не найден' }, { status: 404 })
    if (attempt.completedAt) {
      return NextResponse.json({ error: 'Квиз уже завершён' }, { status: 409 })
    }

    const questions = readQuestions(attempt.questions)
    const question = questions[questionIndex]
    if (!question) {
      return NextResponse.json({ error: 'Вопрос не найден' }, { status: 400 })
    }
    if (selectedIndex !== null && selectedIndex >= question.options.length) {
      return NextResponse.json({ error: 'Вариант ответа не найден' }, { status: 400 })
    }

    const answers = readAnswers(attempt.answers)
    let answer = answers.find((item) => item.questionIndex === questionIndex)
    if (!answer) {
      answer = { questionIndex, selectedIndex }
      answers.push(answer)
      await db.quizAttempt.update({
        where: { id: attempt.id },
        data: { answers: answers as Prisma.InputJsonValue },
      })
    }

    const res = NextResponse.json({
      isCorrect: answer.selectedIndex === question.correctIndex,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (error) {
    console.error('[api/quiz answer] error', error)
    return NextResponse.json({ error: 'Не удалось проверить ответ' }, { status: 500 })
  }
}

/** Complete a server-owned attempt and award XP exactly once. */
export async function PUT(request: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(request, finishSchema)
    if (!parsed.success) return parsed.response

    const result = await db.$transaction(async (tx) => {
      const attempt = await tx.quizAttempt.findFirst({
        where: { id: parsed.data.attemptId, userId: user.id },
      })
      if (!attempt) return { status: 'missing' as const }
      if (attempt.completedAt) {
        const currentUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } })
        return { status: 'complete' as const, attempt, user: currentUser, xpGain: 0 }
      }

      const questions = readQuestions(attempt.questions)
      const answers = readAnswers(attempt.answers)
      const uniqueAnswers = new Map(answers.map((answer) => [answer.questionIndex, answer]))
      if (uniqueAnswers.size !== questions.length) return { status: 'incomplete' as const }

      const scoreResult = scoreQuiz(questions, answers)
      const score = scoreResult.correct
      const xpGain = scoreResult.xpGain
      const won = await tx.quizAttempt.updateMany({
        where: { id: attempt.id, userId: user.id, completedAt: null },
        data: { score, xpAwarded: xpGain, completedAt: new Date() },
      })
      if (won.count === 0) {
        const completed = await tx.quizAttempt.findUniqueOrThrow({ where: { id: attempt.id } })
        const currentUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } })
        return { status: 'complete' as const, attempt: completed, user: currentUser, xpGain: 0 }
      }

      await tx.xpEvent.create({
        data: { userId: user.id, source: 'quiz', sourceId: attempt.id, amount: xpGain },
      })
      const incremented = await tx.user.update({
        where: { id: user.id },
        data: { xp: { increment: xpGain } },
      })
      const level = levelFromXp(incremented.xp)
      const updatedUser = level === incremented.level
        ? incremented
        : await tx.user.update({ where: { id: user.id }, data: { level } })

      await tx.achievement.upsert({
        where: { userId_type: { userId: user.id, type: 'first_quiz' } },
        create: { userId: user.id, type: 'first_quiz' },
        update: {},
      })
      if (score === questions.length) {
        await tx.achievement.upsert({
          where: { userId_type: { userId: user.id, type: 'quiz_perfect' } },
          create: { userId: user.id, type: 'quiz_perfect' },
          update: {},
        })
      }
      await tx.progress.create({
        data: {
          userId: user.id,
          subject: attempt.subject,
          topic: attempt.topic,
          score,
          total: questions.length,
          kind: 'quiz',
        },
      })

      return {
        status: 'awarded' as const,
        attempt: { ...attempt, score, xpAwarded: xpGain },
        user: updatedUser,
        xpGain,
      }
    })

    if (result.status === 'missing') {
      return NextResponse.json({ error: 'Квиз не найден' }, { status: 404 })
    }
    if (result.status === 'incomplete') {
      return NextResponse.json({ error: 'Ответьте на все вопросы' }, { status: 409 })
    }

    const res = NextResponse.json({
      correct: result.attempt.score ?? 0,
      total: result.attempt.total,
      xpGain: result.xpGain,
      xp: result.user.xp,
      level: result.user.level,
    })
    setUserIdCookie(res, user.id)
    return res
  } catch (error) {
    console.error('[api/quiz submit] error', error)
    return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 })
  }
}
