import React from "react"
import type { Metadata } from 'next'
import { Noto_Serif_SC, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { AppProvider } from '@/lib/context'
import { LanguageProvider } from '@/lib/context-language'
import './globals.css'

const notoSerifSC = Noto_Serif_SC({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif-cn"
});
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: '人生解码 - LifeCode',
  description: '解读命运密码，探索人生轨迹',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${notoSerifSC.variable} ${inter.variable} font-serif antialiased`}>
        <LanguageProvider>
          <AppProvider>
            {/* 滚动发生在此层，弹窗锁 body 时不会导致整页左右移位 */}
            <div className="h-full min-h-screen overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </AppProvider>
        </LanguageProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                '!bg-card !text-card-foreground !border !border-border !shadow-lg !rounded-lg !font-serif',
              description: '!text-muted-foreground',
              actionButton:
                '!bg-primary !text-primary-foreground !rounded-lg hover:!opacity-90',
              cancelButton:
                '!bg-muted !text-muted-foreground !rounded-lg hover:!opacity-90',
              closeButton:
                '!bg-transparent !text-muted-foreground hover:!text-foreground hover:!bg-muted !rounded-lg',
            },
            style: {
              borderRadius: '0.5rem',
            },
          }}
          richColors
          closeButton
        />
        <Analytics />
      </body>
    </html>
  )
}
