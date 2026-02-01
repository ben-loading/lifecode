/**
 * 主报告生成 Worker（长时运行）
 *
 * 轮询 Next 应用的 GET /api/report/next-job 领取任务，本地执行 generateMainReport 后
 * 通过 PATCH /api/report/job/[jobId] 回写状态。用于规避 Vercel 函数超时（主报告 LLM 约 100s）。
 *
 * 运行前需配置环境变量（与 .env.local 一致，另加 API_BASE_URL、REPORT_WORKER_SECRET）：
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   DEEPSEEK_API_KEY（或 OPENAI_API_KEY）, LLM_PROVIDER
 *   API_BASE_URL=https://你的域名.vercel.app
 *   REPORT_WORKER_SECRET=与 Vercel 中 REPORT_WORKER_SECRET 相同
 *
 * 从项目根目录运行：
 *   npx tsx scripts/worker-report.ts
 *
 * 部署建议：Railway / Render / 自有 VPS 等长驻进程环境。
 */

const POLL_INTERVAL_MS = Number(process.env.REPORT_WORKER_POLL_MS) || 10_000
const API_BASE = process.env.API_BASE_URL?.replace(/\/$/, '')
const WORKER_SECRET = process.env.REPORT_WORKER_SECRET

function getAuthHeaders(): Record<string, string> {
  const secret = WORKER_SECRET || ''
  return {
    Authorization: `Bearer ${secret}`,
    'Content-Type': 'application/json',
  }
}

async function fetchNextJob(): Promise<{ jobId: string; archiveId: string } | null> {
  if (!API_BASE || !WORKER_SECRET) {
    console.error('[worker] 缺少 API_BASE_URL 或 REPORT_WORKER_SECRET')
    return null
  }
  const res = await fetch(`${API_BASE}/api/report/next-job`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  if (res.status === 204) return null
  if (res.status !== 200) {
    console.error('[worker] next-job failed', res.status, await res.text())
    return null
  }
  const job = (await res.json()) as { jobId: string; archiveId: string }
  if (!job?.jobId || !job?.archiveId) return null
  return { jobId: job.jobId, archiveId: job.archiveId }
}

async function patchJobResult(
  jobId: string,
  status: 'completed' | 'failed',
  error?: string
): Promise<void> {
  if (!API_BASE || !WORKER_SECRET) return
  const res = await fetch(`${API_BASE}/api/report/job/${jobId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, error }),
  })
  if (!res.ok) {
    console.error('[worker] PATCH job failed', res.status, await res.text())
  }
}

async function runOne(): Promise<boolean> {
  const job = await fetchNextJob()
  if (!job) return false

  const { jobId, archiveId } = job
  console.log('[worker] claimed job', jobId, 'archiveId', archiveId)

  const { generateMainReport } = await import(
    '../src/lib/services/report-service'
  )
  try {
    await generateMainReport(archiveId)
    await patchJobResult(jobId, 'completed')
    console.log('[worker] completed job', jobId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[worker] job failed', jobId, msg)
    await patchJobResult(jobId, 'failed', msg)
  }
  return true
}

async function main() {
  if (!API_BASE || !WORKER_SECRET) {
    console.error(
      '[worker] 请设置 API_BASE_URL 与 REPORT_WORKER_SECRET，例如：'
    )
    console.error(
      '  API_BASE_URL=https://xxx.vercel.app REPORT_WORKER_SECRET=xxx npx tsx scripts/worker-report.ts'
    )
    process.exit(1)
  }
  console.log('[worker] started, polling', API_BASE, 'every', POLL_INTERVAL_MS, 'ms')
  for (;;) {
    try {
      const didWork = await runOne()
      if (!didWork) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }
    } catch (e) {
      console.error('[worker] loop error', e)
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }
  }
}

main()
