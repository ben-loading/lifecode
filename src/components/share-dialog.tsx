'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Link2, X } from 'lucide-react'
import { useState } from 'react'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  archiveName: string
  lifeScriptTitle: string
  coreAbility: string
}

export function ShareDialog({
  isOpen,
  onClose,
  archiveName,
  lifeScriptTitle,
  coreAbility,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `https://lifecode.app/report/${archiveName}`
  const roleTag = lifeScriptTitle; // Declare roleTag
  const personalityTraits = [coreAbility]; // Declare personalityTraits

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 1000
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // 绘制背景渐变
      const gradient = ctx.createLinearGradient(0, 0, 0, 1000)
      gradient.addColorStop(0, '#FFF8F0')
      gradient.addColorStop(1, '#FFE8D6')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 800, 1000)

      // 绘制装饰圆形
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.2)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(120, 120, 80, 0, Math.PI * 2)
      ctx.stroke()

      // 绘制装饰方形
      ctx.save()
      ctx.translate(680, 900)
      ctx.rotate((12 * Math.PI) / 180)
      ctx.strokeRect(-50, -50, 100, 100)
      ctx.restore()

      // 绘制标题
      ctx.fillStyle = '#8B4513'
      ctx.font = 'bold 48px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('人生解碼', 400, 150)

      // 绘制分割线
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(360, 180, 80, 6)

      // 绘制档案名
      ctx.font = 'bold 36px system-ui'
      ctx.fillText(`#${archiveName}`, 400, 260)

      // 绘制人生剧本标签
      ctx.fillStyle = '#999'
      ctx.font = '20px system-ui'
      ctx.fillText('人生劇本', 400, 350)

      // 绘制人生剧本标题
      ctx.fillStyle = '#8B4513'
      ctx.font = 'bold 32px system-ui'
      ctx.fillText(lifeScriptTitle, 400, 400)

      // 绘制核心能力标签
      ctx.fillStyle = '#999'
      ctx.font = '20px system-ui'
      ctx.fillText('核心能力', 400, 500)

      // 绘制核心能力文字（多行，居中排版）
      ctx.fillStyle = '#666'
      ctx.font = '22px system-ui'
      ctx.textAlign = 'center'
      const maxWidth = 600
      const lineHeight = 36
      const words = coreAbility.split('')
      let line = ''
      let y = 560

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i]
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, 400, y)
          line = words[i]
          y += lineHeight
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, 400, y)

      // 转换为图片并下载
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${archiveName}-人生解碼.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto p-0 overflow-hidden">
        <div className="relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Share Preview Image */}
          <div className="relative bg-gradient-to-b from-[#FFF8F0] to-[#FFE8D6] p-8 min-h-[500px] flex flex-col items-center justify-center">
            {/* Decorative Elements */}
            <div className="absolute top-6 left-6 w-16 h-16 border-2 border-primary/20 rounded-full" />
            <div className="absolute bottom-6 right-6 w-20 h-20 border-2 border-primary/20 rounded-lg rotate-12" />
            
            {/* Content */}
            <div className="relative z-10 text-center space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-primary tracking-wider">人生解碼</h1>
                <div className="h-1 w-16 bg-primary mx-auto rounded-full" />
              </div>

              {/* Archive Name */}
              <h2 className="text-2xl font-semibold text-foreground">#{archiveName}</h2>

              {/* Life Script */}
              <div className="space-y-2 max-w-xs">
                <p className="text-xs text-muted-foreground tracking-wider">人生劇本</p>
                <h3 className="text-lg font-medium text-primary tracking-wide">{lifeScriptTitle}</h3>
              </div>

              {/* Core Ability */}
              <div className="space-y-2 pt-4 max-w-xs">
                <p className="text-xs text-muted-foreground tracking-wider">核心能力</p>
                <p className="text-sm text-foreground/80 leading-relaxed text-center">{coreAbility}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-5 space-y-3 bg-background">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full justify-center gap-2 bg-transparent"
            >
              <Link2 className="w-4 h-4" />
              {copied ? '已複製連結' : '複製分享連結'}
            </Button>
            <Button
              onClick={handleDownloadImage}
              className="w-full justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              下載分享圖片
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
