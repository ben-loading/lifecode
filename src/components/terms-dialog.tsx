'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface TermsDialogProps {
  isOpen: boolean
  onClose: () => void
  type: 'terms' | 'privacy'
}

export function TermsDialog({ isOpen, onClose, type }: TermsDialogProps) {
  const isTerms = type === 'terms'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogTitle className="text-lg font-semibold mb-4">
          {isTerms ? '用戶協議' : '數據協議'}
        </DialogTitle>
        <div className="space-y-6 text-sm leading-relaxed">
          {isTerms ? (
            <>
              <section>
                <h2 className="text-base font-semibold mb-3">一、服務說明</h2>
                <p className="text-muted-foreground mb-2">
                  歡迎使用「人生解碼」（以下簡稱「本服務」）。本服務旨在通過傳統命理學工具（如八字、紫微斗數等）為用戶提供自我性格探索與人生軌跡分析的參考信息。
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">重要提示：</strong>本服務並非迷信活動，而是基於傳統文化與現代心理學結合的自我探索工具。所有分析結果僅供參考，不應作為人生重大決策的唯一依據。
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3">二、服務性質與免責聲明</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">非科學驗證：</strong>本服務提供的分析基於傳統命理學理論，未經現代科學方法驗證，不構成科學結論。
                  </li>
                  <li>
                    <strong className="text-foreground">僅供參考：</strong>所有報告、解讀和分析結果僅供用戶自我反思與性格探索使用，不應作為醫療、法律、財務等專業領域的決策依據。
                  </li>
                  <li>
                    <strong className="text-foreground">個人責任：</strong>用戶應對基於本服務內容所做的任何決定承擔完全責任。本服務提供方不對用戶因使用本服務而產生的任何直接或間接損失承擔責任。
                  </li>
                  <li>
                    <strong className="text-foreground">不保證準確性：</strong>本服務不保證分析結果的準確性、完整性或適用性。用戶理解並接受分析結果可能存在偏差或與實際情況不符。
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3">三、用戶行為規範</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>用戶應確保提供的個人信息（如出生日期、時間等）真實準確。</li>
                  <li>用戶不得將本服務用於任何違法、欺詐或其他不當目的。</li>
                  <li>用戶不得將本服務的分析結果用於誤導他人或進行商業欺詐。</li>
                  <li>用戶應尊重本服務的知識產權，不得未經授權複製、傳播或商業化使用服務內容。</li>
                </ol>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3">四、服務變更與終止</h2>
                <p className="text-muted-foreground">
                  本服務提供方保留隨時修改、暫停或終止服務的權利，無需提前通知。用戶理解並同意，服務提供方不對因服務變更或終止而產生的任何損失承擔責任。
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3">五、適用法律與爭議解決</h2>
                <p className="text-muted-foreground">
                  本協議的解釋與適用應遵循相關法律法規。如發生爭議，雙方應友好協商解決；協商不成的，應提交有管轄權的法院解決。
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3">六、協議生效</h2>
                <p className="text-muted-foreground">
                  使用本服務即表示您已閱讀、理解並同意接受本協議的全部條款。如您不同意本協議的任何條款，請立即停止使用本服務。
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-base font-semibold mb-3">一、數據收集目的</h2>
                <p className="text-muted-foreground mb-2">
                  為了向您提供準確的報告解讀和分析服務，我們需要收集以下類型的個人信息：
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">基本信息：</strong>電子郵箱地址（用於賬戶登錄和驗證）
                  </li>
                  <li>
                    <strong className="text-foreground">命理數據：</strong>出生日期、出生時間、出生地點等（用於生成命盤和報告分析）
                  </li>
                  <li>
                    <strong className="text-foreground">使用數據：</strong>您創建的檔案信息、報告生成記錄、服務使用記錄等
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3">二、數據使用範圍</h2>
                <p className="text-muted-foreground mb-2">
                  我們收集的數據將僅用於以下目的：
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">報告生成：</strong>使用您提供的出生信息生成命盤，並基於命盤數據進行報告解讀和分析。
                  </li>
                  <li>
                    <strong className="text-foreground">服務提供：</strong>為您提供賬戶管理、檔案管理、報告查看等核心功能。
                  </li>
                  <li>
                    <strong className="text-foreground">服務改進：</strong>分析服務使用情況，優化服務質量和用戶體驗（數據將進行匿名化處理）。
                  </li>
                  <li>
                    <strong className="text-foreground">賬戶安全：</strong>驗證您的身份，保護賬戶安全，防止欺詐和濫用。
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3">三、數據存儲與安全</h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">數據存儲：</strong>您的數據將存儲在安全的雲端服務器中，採用行業標準的加密技術保護。
                  </li>
                  <li>
                    <strong className="text-foreground">數據保留：</strong>在您使用服務期間，我們將保留您的數據。如您註銷賬戶，我們將在合理期限內刪除您的個人數據。
                  </li>
                  <li>
                    <strong className="text-foreground">安全措施：</strong>我們採取技術和管理措施保護您的數據安全，但無法保證絕對安全。請您妥善保管賬戶信息。
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3">四、數據共享與披露</h2>
                <p className="text-muted-foreground mb-2">
                  我們承諾：
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>不會向第三方出售您的個人數據。</li>
                  <li>不會在未經您同意的情況下向第三方共享您的個人數據，除非法律法規要求。</li>
                  <li>僅在必要時與服務提供商（如雲存儲、支付處理等）共享數據，且這些服務提供商需遵守嚴格的數據保護義務。</li>
                </ol>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3">五、您的權利</h2>
                <p className="text-muted-foreground mb-2">
                  您對您的個人數據享有以下權利：
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">訪問權：</strong>您可以隨時查看我們收集的關於您的個人數據。
                  </li>
                  <li>
                    <strong className="text-foreground">更正權：</strong>您可以更正或更新您的個人數據。
                  </li>
                  <li>
                    <strong className="text-foreground">刪除權：</strong>您可以要求刪除您的個人數據（註銷賬戶）。
                  </li>
                  <li>
                    <strong className="text-foreground">撤回同意：</strong>您可以撤回對數據處理的同意，但這可能影響您使用某些服務功能。
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3">六、協議變更</h2>
                <p className="text-muted-foreground">
                  我們可能會不定期更新本數據協議。重大變更將通過適當方式通知您。繼續使用服務即表示您接受更新後的協議。
                </p>
              </section>

              <section>
                <h2 className="text-base font-semibold mb-3">七、聯繫我們</h2>
                <p className="text-muted-foreground">
                  如您對本數據協議有任何疑問，或需要行使您的數據權利，請通過應用內的「聯繫客服」功能與我們聯繫。
                </p>
              </section>
            </>
          )}

          <section className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              最後更新時間：2026年2月14日
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
