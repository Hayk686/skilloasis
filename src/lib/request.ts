import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; response: NextResponse }
> {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (parsed.success) return { success: true, data: parsed.data }
  return {
    success: false,
    response: NextResponse.json(
      {
        error: 'Некорректные данные запроса',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 }
    ),
  }
}

export const shortText = (max: number) => z.string().trim().min(1).max(max)
