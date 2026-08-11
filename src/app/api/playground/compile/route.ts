import { NextResponse } from 'next/server'
import ts from 'typescript'
import { z } from 'zod'
import { parseJsonBody } from '@/lib/request'

const compileSchema = z.object({
  code: z.string().min(1).max(20_000),
})

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, compileSchema)
  if (!parsed.success) return parsed.response

  const result = ts.transpileModule(parsed.data.code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
    },
    reportDiagnostics: true,
  })
  const errors = result.diagnostics?.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  ) ?? []

  if (errors.length > 0) {
    return NextResponse.json(
      {
        error: errors
          .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
          .join('\n'),
      },
      { status: 400 }
    )
  }

  return NextResponse.json({ code: result.outputText })
}
