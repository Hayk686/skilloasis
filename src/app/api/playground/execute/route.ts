import { NextResponse } from 'next/server'
import { z } from 'zod'
import { parseJsonBody } from '@/lib/request'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const executeSchema = z.object({
  code: z.string().min(1).max(20_000),
  language: z.enum(['python', 'java', 'cpp', 'csharp', 'go', 'rust']),
})

const COMPILERS = {
  python: 'cpython-3.13.8',
  java: 'openjdk-jdk-21+35',
  cpp: 'gcc-13.2.0',
  csharp: 'mono-6.12.0.199',
  go: 'go-1.23.2',
  rust: 'rust-1.82.0',
} as const

interface WandboxResponse {
  status?: string
  signal?: string
  compiler_output?: string
  compiler_error?: string
  compiler_message?: string
  program_output?: string
  program_error?: string
  program_message?: string
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, executeSchema)
  if (!parsed.success) return parsed.response

  try {
    const response = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Info Oasis-Code-Playground/1.0',
      },
      body: JSON.stringify({
        compiler: COMPILERS[parsed.data.language],
        code: parsed.data.code,
        stdin: '',
        options: '',
        'compiler-option-raw': '',
        'runtime-option-raw': '',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'The code runner is temporarily unavailable.' }, { status: 502 })
    }

    const data = await response.json() as WandboxResponse
    const compilerError = data.compiler_error || data.compiler_output || ''
    const runtimeError = data.program_error || ''
    const error = [compilerError, runtimeError].filter(Boolean).join('\n').trim()

    return NextResponse.json({
      output: data.program_output ?? '',
      error,
      status: data.status ?? '',
      signal: data.signal ?? '',
    })
  } catch (error) {
    console.error('[api/playground/execute] error', error)
    return NextResponse.json({ error: 'The code runner timed out or could not be reached.' }, { status: 504 })
  }
}
