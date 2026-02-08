'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Copy, Trash2, CheckCircle2, XCircle, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { createRedemptionCode, listRedemptionCodes, deleteRedemptionCode, type AdminRedemptionCode } from '@/lib/api-client'
import { useAppContext } from '@/lib/context'
import { LoginModal } from '@/components/login-modal'
import { toast } from 'sonner'

export function RedemptionCodesAdminPage() {
  const router = useRouter()
  const { user } = useAppContext()
  const [codes, setCodes] = useState<AdminRedemptionCode[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [amount, setAmount] = useState('200')
  const [note, setNote] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // 检查登录状态
  useEffect(() => {
    if (!user.isLoggedIn) {
      setShowLoginModal(true)
    }
  }, [user.isLoggedIn])

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    // 登录成功后重新加载数据
    loadCodes()
  }

  const loadCodes = async () => {
    if (!user.isLoggedIn) {
      return
    }
    setLoading(true)
    try {
      const result = await listRedemptionCodes({ limit: 50, includeUsed: true })
      setCodes(result.codes)
      setTotal(result.total)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载失败'
      if (msg.includes('管理员') || msg.includes('403') || msg.includes('未登录')) {
        toast.error('无管理员权限，请使用管理员邮箱登录')
        setShowLoginModal(true)
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user.isLoggedIn) {
      loadCodes()
    }
  }, [user.isLoggedIn])

  const handleCreate = async () => {
    const amountNum = parseInt(amount, 10)
    if (!amountNum || amountNum <= 0) {
      toast.error('请输入有效的能量值')
      return
    }

    setCreating(true)
    try {
      const result = await createRedemptionCode({
        amount: amountNum,
        note: note.trim() || undefined,
      })
      toast.success('兑换码生成成功')
      setShowCreateDialog(false)
      setAmount('200')
      setNote('')
      await loadCodes()
      // 自动复制新生成的兑换码
      await handleCopy(result.code)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '生成失败'
      if (msg.includes('管理员') || msg.includes('403')) {
        toast.error('无管理员权限')
      } else {
        toast.error(msg)
      }
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      toast.error('复制失败')
    }
  }

  const handleDelete = async (code: string) => {
    if (!confirm(`确定要删除兑换码 ${code} 吗？`)) return
    
    try {
      await deleteRedemptionCode(code)
      toast.success('删除成功')
      await loadCodes()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '删除失败'
      if (msg.includes('已使用')) {
        toast.error('无法删除已使用的兑换码')
      } else {
        toast.error(msg)
      }
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 如果未登录，显示登录提示
  if (!user.isLoggedIn) {
    return (
      <main className="min-h-screen bg-background text-foreground max-w-4xl mx-auto flex flex-col">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-5 py-4">
            <button
              onClick={() => router.back()}
              className="text-foreground hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium tracking-wide">兑换码管理</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center px-5">
          <Card className="border-border max-w-md w-full">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <LogIn className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-foreground mb-2">请先登录</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  访问后台管理系统需要管理员权限，请使用管理员邮箱登录
                </p>
                <Button onClick={() => setShowLoginModal(true)} className="gap-2">
                  <LogIn className="w-4 h-4" />
                  登录
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false)
            router.push('/')
          }}
          onSuccess={handleLoginSuccess}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground max-w-4xl mx-auto flex flex-col">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-5 py-4">
          <button
            onClick={() => router.back()}
            className="text-foreground hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium tracking-wide">兑换码管理</h1>
          <div className="flex-1" />
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2" disabled={!user.isLoggedIn}>
            <Plus className="w-4 h-4" />
            生成兑换码
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* 统计信息 */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">总兑换码数</div>
              <div className="text-2xl font-medium mt-1">{total}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">未使用</div>
              <div className="text-2xl font-medium mt-1">
                {codes.filter((c) => !c.usedBy).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 兑换码列表 */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">加载中...</div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">暂无兑换码</div>
        ) : (
          <div className="space-y-3">
            {codes.map((code) => (
              <Card key={code.code} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-lg font-mono font-semibold text-foreground bg-muted px-2 py-1 rounded">
                          {code.code}
                        </code>
                        {code.usedBy ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <XCircle className="w-3 h-3 text-destructive" />
                            已使用
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                            未使用
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">能量值：</span>
                          <span className="font-medium text-primary">{code.amount}</span>
                        </div>
                        {code.note && (
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">备注：</span>
                            <span>{code.note}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">创建时间：</span>
                          <span>{formatDate(code.createdAt)}</span>
                        </div>
                        {code.usedBy && (
                          <>
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">使用者：</span>
                              <span className="text-sm">{code.usedByEmail || code.usedBy}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">使用时间：</span>
                              <span>{formatDate(code.usedAt)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(code.code)}
                        className="gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedCode === code.code ? '已复制' : '复制'}
                      </Button>
                      {!code.usedBy && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(code.code)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 生成兑换码弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogTitle className="sr-only">生成兑换码</DialogTitle>
          <div className="space-y-5 py-2">
            <div className="text-center">
              <h3 className="text-base font-medium text-foreground">生成兑换码</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="amount" className="text-sm text-foreground block mb-1">
                  能量值
                </label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="200"
                  min="1"
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="note" className="text-sm text-foreground block mb-1">
                  备注（可选）
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例如：活动赠送"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1"
                disabled={creating}
              >
                取消
              </Button>
              <Button onClick={handleCreate} className="flex-1" disabled={creating}>
                {creating ? '生成中...' : '生成'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 登录弹窗（邮箱验证码登录） */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false)
          if (!user.isLoggedIn) {
            router.push('/')
          }
        }}
        onSuccess={handleLoginSuccess}
      />
    </main>
  )
}
