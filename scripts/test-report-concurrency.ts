/**
 * 报告接口并发压测脚本
 *
 * 用法示例：
 * MODE=main ARCHIVE_ID=xxx TOKEN=xxx BASE_URL=http://localhost:3004 CONCURRENCY=10 npx tsx scripts/test-report-concurrency.ts
 * MODE=deep ARCHIVE_ID=xxx REPORT_TYPE=future_fortune TOKEN=xxx BASE_URL=http://localhost:3004 CONCURRENCY=10 npx tsx scripts/test-report-concurrency.ts
 */

export {}

type Mode = 'main' | 'deep'

interface ApiErrorShape {
  error?: string
  message?: string
  code?: string
}

interface RequestResult {
  index: number
  ok: boolean
  status: number
  code?: string
  error?: string
  jobId?: string
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`缺少环境变量: ${name}`)
  }
  return value
}

function getEnvInt(name: string, fallback: number): number {
  const value = process.env[name]?.trim()
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function getEnvBool(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase()
  if (!value) return fallback
  return value === '1' || value === 'true' || value === 'yes'
}

async function requestJson(
  baseUrl: string,
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; ok: boolean; data: unknown; raw: string }> {
  const url = `${baseUrl}${path}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  const res = await fetch(url, { ...init, headers })
  const raw = await res.text()
  let data: unknown = raw
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    // keep raw text
  }
  return { status: res.status, ok: res.ok, data, raw }
}

function normalizeError(data: unknown): ApiErrorShape {
  if (!data || typeof data !== 'object') return {}
  const maybe = data as Record<string, unknown>
  return {
    error: typeof maybe.error === 'string' ? maybe.error : undefined,
    message: typeof maybe.message === 'string' ? maybe.message : undefined,
    code: typeof maybe.code === 'string' ? maybe.code : undefined,
  }
}

function countConsumes(list: unknown[], keyword: string): number {
  return list.filter((item) => {
    if (!item || typeof item !== 'object') return false
    const row = item as Record<string, unknown>
    return row.type === 'consume' && typeof row.description === 'string' && row.description.includes(keyword)
  }).length
}

async function main() {
  const mode = (process.env.MODE?.trim() || 'main') as Mode
  if (mode !== 'main' && mode !== 'deep') {
    throw new Error('MODE 仅支持 main 或 deep')
  }

  const baseUrl = (process.env.BASE_URL?.trim() || 'http://localhost:3004').replace(/\/$/, '')
  const token = requireEnv('TOKEN')
  const archiveId = requireEnv('ARCHIVE_ID')
  const concurrency = getEnvInt('CONCURRENCY', 10)
  const retry = process.env.RETRY === '1' || process.env.RETRY === 'true'
  const reportType = mode === 'deep' ? requireEnv('REPORT_TYPE') : ''
  const strict = getEnvBool('STRICT', true)
  const maxConsumeDelta = getEnvInt('EXPECT_MAX_CONSUME_DELTA', 1)
  const maxJobIds = getEnvInt('EXPECT_MAX_JOB_IDS', 1)

  const txKeyword = mode === 'main' ? '主報告生成' : `深度報告：${reportType}`
  const endpoint = mode === 'main' ? '/api/report/generate' : '/api/report/deep/generate'
  const body =
    mode === 'main'
      ? { archiveId, retry }
      : { archiveId, reportType, retry }

  console.log('=== 并发压测开始 ===')
  console.log(`mode=${mode}, concurrency=${concurrency}, archiveId=${archiveId}, retry=${retry}`)
  if (mode === 'deep') console.log(`reportType=${reportType}`)
  console.log(`strict=${strict}, expect: consumeDelta<=${maxConsumeDelta}, jobIds<=${maxJobIds}`)

  const beforeBalanceRes = await requestJson(baseUrl, token, '/api/energy/balance', { method: 'GET' })
  const beforeTxRes = await requestJson(baseUrl, token, '/api/transactions', { method: 'GET' })
  if (!beforeBalanceRes.ok || !beforeTxRes.ok) {
    throw new Error(`预检查失败: balance=${beforeBalanceRes.status}, tx=${beforeTxRes.status}`)
  }

  const beforeBalance = Number((beforeBalanceRes.data as Record<string, unknown>).balance ?? 0)
  const beforeList = ((beforeTxRes.data as Record<string, unknown>).list ?? []) as unknown[]
  const beforeConsumes = countConsumes(beforeList, txKeyword)
  console.log(`before balance=${beforeBalance}, consumeCount(keyword="${txKeyword}")=${beforeConsumes}`)

  const startedAt = Date.now()
  const calls = Array.from({ length: concurrency }, (_, i) =>
    requestJson(baseUrl, token, endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
      .then((res): RequestResult => {
        const err = normalizeError(res.data)
        const jobId =
          typeof (res.data as Record<string, unknown>)?.jobId === 'string'
            ? ((res.data as Record<string, unknown>).jobId as string)
            : undefined
        return {
          index: i,
          ok: res.ok,
          status: res.status,
          code: err.code,
          error: err.error ?? err.message,
          jobId,
        }
      })
      .catch((e) => ({
        index: i,
        ok: false,
        status: 0,
        code: undefined,
        error: e instanceof Error ? e.message : String(e),
        jobId: undefined,
      }))
  )

  const results = await Promise.all(calls)
  const elapsed = Date.now() - startedAt

  const success = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)
  const statusCount = new Map<number, number>()
  for (const r of results) statusCount.set(r.status, (statusCount.get(r.status) ?? 0) + 1)

  console.log('\n=== 请求结果 ===')
  console.log(`elapsedMs=${elapsed}`)
  console.log(`ok=${success.length}, failed=${failed.length}`)
  console.log(
    `statusHistogram=${JSON.stringify(
      Object.fromEntries(Array.from(statusCount.entries()).sort((a, b) => a[0] - b[0]))
    )}`
  )
  const uniqueCodes = Array.from(new Set(results.map((r) => r.code).filter(Boolean)))
  if (uniqueCodes.length > 0) console.log(`errorCodes=${uniqueCodes.join(',')}`)
  const uniqueJobIds = Array.from(new Set(results.map((r) => r.jobId).filter(Boolean)))
  console.log(`jobIds(count=${uniqueJobIds.length})=${uniqueJobIds.join(',') || '(none)'}`)

  const afterBalanceRes = await requestJson(baseUrl, token, '/api/energy/balance', { method: 'GET' })
  const afterTxRes = await requestJson(baseUrl, token, '/api/transactions', { method: 'GET' })
  if (!afterBalanceRes.ok || !afterTxRes.ok) {
    throw new Error(`后检查失败: balance=${afterBalanceRes.status}, tx=${afterTxRes.status}`)
  }

  const afterBalance = Number((afterBalanceRes.data as Record<string, unknown>).balance ?? 0)
  const afterList = ((afterTxRes.data as Record<string, unknown>).list ?? []) as unknown[]
  const afterConsumes = countConsumes(afterList, txKeyword)

  const consumeDelta = afterConsumes - beforeConsumes
  const balanceDelta = afterBalance - beforeBalance

  console.log('\n=== 账务结果 ===')
  console.log(`after balance=${afterBalance}, delta=${balanceDelta}`)
  console.log(`consumeCount delta(keyword="${txKeyword}")=${consumeDelta}`)

  if (mode === 'main') {
    const statusRes = await requestJson(baseUrl, token, `/api/report/archive/${archiveId}/status`, { method: 'GET' })
    console.log('\n=== 主报告状态 ===')
    console.log(`statusApi=${statusRes.status}, body=${typeof statusRes.data === 'string' ? statusRes.data : JSON.stringify(statusRes.data)}`)
  } else {
    const statusRes = await requestJson(baseUrl, token, `/api/report/deep/archive/${archiveId}/status`, { method: 'GET' })
    const data = statusRes.data as Record<string, unknown>
    const item = (data?.[reportType] ?? null) as unknown
    console.log('\n=== 深度报告状态 ===')
    console.log(`statusApi=${statusRes.status}, item(${reportType})=${item ? JSON.stringify(item) : 'null'}`)
  }

  console.log('\n=== 判定建议 ===')
  console.log(`- 期望 consumeDelta <= ${maxConsumeDelta}，当前=${consumeDelta}`)
  console.log(`- 期望有效 jobId <= ${maxJobIds}，当前=${uniqueJobIds.length}`)

  const violations: string[] = []
  if (consumeDelta > maxConsumeDelta) {
    violations.push(`consumeDelta=${consumeDelta} 超过阈值 ${maxConsumeDelta}`)
  }
  if (uniqueJobIds.length > maxJobIds) {
    violations.push(`jobIds=${uniqueJobIds.length} 超过阈值 ${maxJobIds}`)
  }

  if (violations.length === 0) {
    console.log('✅ 判定通过：未发现重复扣费/重复建任务迹象')
    return
  }

  console.log('❌ 判定失败：')
  for (const v of violations) console.log(`- ${v}`)

  if (strict) {
    process.exitCode = 1
  } else {
    console.log('⚠️ STRICT=false，已保留退出码 0（仅告警）')
  }
}

main().catch((e) => {
  console.error('[test-report-concurrency] failed:', e)
  process.exitCode = 1
})
