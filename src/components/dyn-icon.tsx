'use client'

import * as Icons from 'lucide-react'
import { LucideProps } from 'lucide-react'

export function DynIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Comp = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name]
  if (!Comp) return <Icons.Sparkles {...props} />
  return <Comp {...props} />
}
