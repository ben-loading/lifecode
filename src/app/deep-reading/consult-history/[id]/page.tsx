'use client'

import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const mockDetails: Record<
  string,
  {
    title: string
    intro: string
    analysis: string[]
    suggestion: string
  }
> = {
  'R-20250118-001': {
    title: '职业转型是否合适？',
    intro:
      '本次咨询围绕「是否从稳定岗位跳到一个不确定但更有成长空间的新机会」展开，以下内容为咨询师根据你的人生编码与具体对话整理的要点。',
    analysis: [
      '你目前的岗位给到的是稳定感，但成长斜率已经放缓。继续留下来的收益更多来自于「安全感」，而不是能力的升级。',
      '新机会与命盘中的「开创、攻坚」能量更匹配，但短期内会带来收入波动与身份不确定感。',
      '你真正担心的不是失败本身，而是「做错决定浪费几年时间」。这一点需要通过设定可回退的边界来安放。',
    ],
    suggestion:
      '可以考虑「先小范围试水」：用半年到一年的时间，在保证基本生活安全的前提下，让自己真实体验新赛道，而不是只在脑子里预演。',
  },
}

export default function ConsultHistoryDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = decodeURIComponent(params.id)

  const detail =
    mockDetails[id] ??
    mockDetails['R-20250118-001']

  return (
    <main className="min-h-screen bg-background text-foreground max-w-md mx-auto flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => router.back()}
            className="text-foreground hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-medium tracking-wide">真人1V1 · 咨询记录</h1>
            <p className="text-[11px] text-muted-foreground">预约号 {id}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
        <section className="space-y-2">
          <h2 className="text-base font-medium tracking-wide">{detail.title}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            以下内容为咨询师根据你当时的提问、对话记录，以及人生编码结构所做的整理总结，方便你在不同阶段反复回看。
          </p>
        </section>

        <Separator className="bg-border" />

        <section className="space-y-3">
          <h3 className="text-sm font-medium tracking-wide">01 · 咨询背景</h3>
          <p className="text-sm text-foreground/80 leading-[1.8] text-justify">
            {detail.intro}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium tracking-wide">02 · 关键洞察</h3>
          <ul className="space-y-2 text-sm text-foreground/80 leading-[1.7]">
            {detail.analysis.map((item, idx) => (
              <li key={idx}>· {item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-medium tracking-wide">03 · 后续行动建议</h3>
          <p className="text-sm text-foreground/80 leading-[1.8] text-justify">
            {detail.suggestion}
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium tracking-wide">备注</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            后续如果你在同一主题下有新的进展，可以在下一次真人咨询时携带本条记录，一起作为「连续对话」的材料。
            后台会继续以预约号为锚点归档。
          </p>
        </section>
      </div>
    </main>
  )
}

