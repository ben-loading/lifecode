import { NextResponse } from 'next/server'
import { getNextRunningReportJobAndClaim } from '@/lib/db'

const WORKER_SECRET = process.env.REPORT_WORKER_SECRET

function requireWorkerAuth(request: Request): boolean {
  if (!WORKER_SECRET?.length) return false
  const auth = request.headers.get('Authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : request.headers.get('X-Worker-Secret')
  return token === WORKER_SECRET
}

/** Worker 轮询：领取下一个 status=running 的任务并改为 processing，返回任务或 204 */
export async function GET(request: Request) {
  if (!requireWorkerAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const job = await getNextRunningReportJobAndClaim()
    if (!job) {
      return new Response(null, { status: 204 })
    }
    return NextResponse.json(job)
  } catch (e) {
    console.error('[report/next-job]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
