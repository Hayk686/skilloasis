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

const MINDMAP_SYSTEM = `Ты — генератор концептуальных карт знаний (mind maps).
Создавай карту в СТРОГОМ JSON формате — иерархию узлов:
{
  "root": {
    "id": "root",
    "label": "Название темы",
    "children": [
      {
        "id": "c1",
        "label": "Подтема 1",
        "children": [
          { "id": "c1-1", "label": "Деталь 1.1" },
          { "id": "c1-2", "label": "Деталь 1.2" }
        ]
      },
      {
        "id": "c2",
        "label": "Подтема 2",
        "children": [
          { "id": "c2-1", "label": "Деталь 2.1" },
          { "id": "c2-2", "label": "Деталь 2.2" }
        ]
      }
    ]
  }
}
Правила:
- 4-7 подтем на первом уровне, каждая с 2-4 дочерними.
- Глубина — максимум 3 уровня.
- Яркие, короткие подписи (1-4 слова).
- Покрывай ключевые аспекты темы.
- id — уникальные строки (напр. "c1", "c1-1").`

export async function POST(req: Request) {
  try {
    const user = await getOrCreateUser()
    const parsed = await parseJsonBody(req, mindMapSchema)
    if (!parsed.success) return parsed.response
    const { topic } = parsed.data

    const raw = await complete(MINDMAP_SYSTEM, [
      { role: 'user', content: `Создай карту знаний по теме: "${topic}"` },
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
