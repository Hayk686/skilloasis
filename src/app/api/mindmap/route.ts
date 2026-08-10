import { NextResponse } from 'next/server'
import { getOrCreateUser, setUserIdCookie, grantXp, unlockAchievement, recordProgress } from '@/lib/gamify'
import { complete, safeJsonParse } from '@/lib/ai'
import { parseJsonBody, shortText } from '@/lib/request'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const mindMapSchema = z.object({ topic: shortText(200) })

interface MindMapNode {
  id: string
  label: string
  children?: MindMapNode[]
}

const MINDMAP_SYSTEM = `Create a knowledge mind map as a strict JSON node hierarchy:
{
  "root": {
    "id": "root",
    "label": "Topic name",
    "children": [
      {
        "id": "c1",
        "label": "Subtopic 1",
        "children": [
          { "id": "c1-1", "label": "Detail 1.1" },
          { "id": "c1-2", "label": "Detail 1.2" }
        ]
      },
      {
        "id": "c2",
        "label": "Subtopic 2",
        "children": [
          { "id": "c2-1", "label": "Detail 2.1" },
          { "id": "c2-2", "label": "Detail 2.2" }
        ]
      }
    ]
  }
}
Rules:
- Create 4-7 first-level subtopics with 2-4 children each.
- Use at most three levels.
- Use vivid labels of 1-4 words.
- Cover the topic's key aspects.
- Use unique string IDs such as "c1" and "c1-1".
- Localize every label into the required output language.`

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(req, mindMapSchema)
    if (!parsed.success) return parsed.response
    const { topic } = parsed.data

    const raw = await complete(MINDMAP_SYSTEM, [
      { role: 'user', content: `Create a knowledge map about: "${topic}"` },
    ], { temperature: 0.7, json: true })

    const map = safeJsonParse<{ root: MindMapNode }>(raw, {
      root: { id: 'root', label: topic, children: [] },
    })

    await grantXp(user.id, 10)
    await unlockAchievement(user.id, 'first_mindmap')
    await recordProgress(user.id, 'general', topic, 1, 1, 'lesson')

    const res = NextResponse.json({ map, topic })
    setUserIdCookie(res, user.id)
    return res
  } catch (err) {
    console.error('[api/mindmap] error', err)
    return NextResponse.json({ error: 'Не удалось создать карту' }, { status: 500 })
  }
}
