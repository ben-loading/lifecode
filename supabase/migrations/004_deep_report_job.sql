-- 深度报告生成任务表（与 ReportJob 类似，用于深度报告 job 流程）
CREATE TABLE IF NOT EXISTS "DeepReportJob" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "archiveId" TEXT NOT NULL,
  "reportType" TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "currentStep" INTEGER,
  "totalSteps" INTEGER,
  "stepLabel" TEXT,
  error TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeepReportJob_archiveId_fkey" FOREIGN KEY ("archiveId")
    REFERENCES "Archive"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DeepReportJob_archiveId_idx" ON "DeepReportJob"("archiveId");
CREATE INDEX IF NOT EXISTS "DeepReportJob_reportType_idx" ON "DeepReportJob"("reportType");
CREATE INDEX IF NOT EXISTS "DeepReportJob_status_idx" ON "DeepReportJob"(status);
CREATE INDEX IF NOT EXISTS "DeepReportJob_createdAt_idx" ON "DeepReportJob"("createdAt");
