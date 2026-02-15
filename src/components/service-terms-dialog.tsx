'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface ServiceTermsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ServiceTermsDialog({ isOpen, onClose }: ServiceTermsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogTitle className="text-lg font-semibold mb-4">
          服務協議
        </DialogTitle>
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-base font-semibold mb-3">一、服務性質與技術說明</h2>
            <p className="text-muted-foreground mb-3">
              本產品提供的各類分析解讀服務（包括但不限於基礎分析、深度解讀、AI解答等）均基於以下技術原理和服務性質：
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">技術原理：</strong>本服務結合傳統命理學知識（如八字、紫微斗數等）與現代社會常識，通過大型語言模型（LLM）等人工智能技術進行推理分析。所有分析結果均由計算機算法生成，並非人工直接解讀。
              </li>
              <li>
                <strong className="text-foreground">服務目的：</strong>本服務旨在輔助用戶了解自我、探索自我性格特質和人生軌跡，提供參考性信息，幫助用戶進行自我反思和思考。
              </li>
              <li>
                <strong className="text-foreground">技術局限性：</strong>大型語言模型存在隨機性和不確定性，相同輸入可能產生不同輸出。分析結果可能因模型版本、參數設置等因素而有所差異。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">二、服務使用規範</h2>
            <p className="text-muted-foreground mb-3">
              用戶在使用本服務時，應當遵循以下規範：
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">科學理性看待：</strong>用戶應當以科學、理性的態度對待所有分析結果，理解這些結果僅為參考信息，不應盲目迷信或過度相信。分析結果不應作為人生重大決策的唯一依據。
              </li>
              <li>
                <strong className="text-foreground">不應視為實際結果：</strong>所有分析解讀均為基於傳統理論和現代技術的推測性內容，不構成對未來事件的預測或保證。用戶理解並接受，這些結果不應被視為實際發生的事件或結果。
              </li>
              <li>
                <strong className="text-foreground">結合實際情況：</strong>用戶應當結合自身實際情況、個人判斷和專業建議，綜合考慮後做出決策。本服務不替代專業的心理諮詢、醫療、法律、財務等專業服務。
              </li>
              <li>
                <strong className="text-foreground">禁止誤導他人：</strong>用戶不得將本服務的分析結果用於誤導、欺詐他人，或進行任何違法、不當行為。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">三、真人一對一諮詢服務說明</h2>
            <p className="text-muted-foreground mb-3">
              本產品提供的真人一對一諮詢服務（以下簡稱「諮詢服務」）性質如下：
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">服務性質：</strong>諮詢服務為輔助探索服務，旨在通過與專業諮詢師的對話，更好地幫助用戶了解自我、探索人生議題。
              </li>
              <li>
                <strong className="text-foreground">服務目的：</strong>諮詢服務提供對話交流平台，協助用戶進行自我反思和思考，不構成專業的心理治療、醫療診斷或法律建議。
              </li>
              <li>
                <strong className="text-foreground">理性對待：</strong>用戶應當理性對待諮詢師的建議和觀點，理解這些內容為輔助了解工具，不應過度迷信或完全依賴。諮詢師的觀點和建議僅代表個人專業見解，不構成絕對真理或預測。
              </li>
              <li>
                <strong className="text-foreground">科學看待：</strong>用戶應當以科學的態度對待諮詢服務，結合自身情況和專業判斷，理性分析諮詢內容，不應盲目跟從或過度依賴。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">四、能量虛擬服務說明</h2>
            <p className="text-muted-foreground mb-3">
              本產品採用「能量」作為虛擬服務計量單位，相關說明如下：
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">虛擬服務性質：</strong>能量為本產品的虛擬服務計量單位，屬於虛擬數字商品，不具有實際貨幣價值，不能兌換為現金或其他實物。
              </li>
              <li>
                <strong className="text-foreground">服務用途：</strong>能量僅能用於本產品內的服務使用，包括但不限於：
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>基礎分析服務的支付和使用</li>
                  <li>深度解讀服務的支付和使用</li>
                  <li>AI解答服務的支付和使用</li>
                  <li>真人一對一諮詢服務的支付和使用</li>
                </ul>
              </li>
              <li>
                <strong className="text-foreground">使用標準：</strong>能量作為本產品各類服務的支付、使用及服務標準，用於計量和結算服務費用。
              </li>
              <li>
                <strong className="text-foreground">使用限制：</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>能量不能用于本產品服務外的任何用途</li>
                  <li>能量不能用于提現、退現、返現等貨幣兌換操作</li>
                  <li>能量不能轉讓、贈與或交易給其他用戶</li>
                  <li>能量不能兌換為其他虛擬或實物商品</li>
                </ul>
              </li>
              <li>
                <strong className="text-foreground">獲得方式：</strong>用戶可通過以下方式獲得能量：
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>充值購買（通過支付平台購買）</li>
                  <li>參與活動獲得（如推廣活動、促銷活動等）</li>
                  <li>其他本產品官方認可的方式</li>
                </ul>
              </li>
              <li>
                <strong className="text-foreground">退款政策：</strong>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>通過充值獲得的能量，一旦充值成功，恕不退款</li>
                  <li>通過活動獲得的能量，不能退現、返現或兌換為現金</li>
                  <li>已使用的能量不能退還或補償</li>
                  <li>能量餘額不能申請退款或提現</li>
                </ul>
              </li>
              <li>
                <strong className="text-foreground">消費建議：</strong>請用戶根據實際需求謹慎合理消費，按需充值，避免過度消費。能量為虛擬服務計量單位，不具有實際價值，請理性對待。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">五、服務免責聲明</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">不保證準確性：</strong>本服務不保證分析結果的準確性、完整性或適用性。由於技術限制和模型特性，分析結果可能存在偏差、錯誤或與實際情況不符。
              </li>
              <li>
                <strong className="text-foreground">不構成專業建議：</strong>本服務提供的所有內容（包括AI分析和真人諮詢）不構成醫療、法律、財務、心理治療等專業領域的建議或診斷。
              </li>
              <li>
                <strong className="text-foreground">個人責任：</strong>用戶應對基於本服務內容所做的任何決定承擔完全責任。本服務提供方不對用戶因使用本服務而產生的任何直接或間接損失承擔責任。
              </li>
              <li>
                <strong className="text-foreground">技術風險：</strong>由於大型語言模型的技術特性，服務可能出現中斷、延遲、錯誤等情況，本服務提供方不保證服務的連續性和穩定性。
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">六、服務變更與終止</h2>
            <p className="text-muted-foreground">
              本服務提供方保留隨時修改、暫停或終止服務的權利。如因服務變更或終止導致用戶能量無法使用，本服務提供方將在合理範圍內提供解決方案，但不承擔退款義務。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">七、協議生效</h2>
            <p className="text-muted-foreground">
              使用本服務即表示您已閱讀、理解並同意接受本協議的全部條款。如您不同意本協議的任何條款，請立即停止使用本服務。
            </p>
          </section>

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
