-- ============================================
-- 报告任务原子启动函数（扣费 + 交易 + 建任务）
-- 目标：避免「已扣费但任务未创建」与并发重复扣费
-- 在 Supabase Dashboard -> SQL Editor 中执行
-- ============================================

CREATE OR REPLACE FUNCTION public.start_main_report_job(
  p_user_id TEXT,
  p_archive_id TEXT,
  p_cost INTEGER,
  p_step_label TEXT,
  p_charge BOOLEAN
)
RETURNS TABLE(job_id TEXT, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('main:' || p_archive_id));

  IF EXISTS (
    SELECT 1
    FROM public."ReportJob"
    WHERE "archiveId" = p_archive_id
      AND status IN ('running', 'processing')
  ) THEN
    RETURN QUERY SELECT NULL::TEXT, 'JOB_ALREADY_RUNNING'::TEXT;
    RETURN;
  END IF;

  IF p_charge THEN
    UPDATE public."User"
    SET balance = balance - p_cost,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = p_user_id
      AND balance >= p_cost;

    IF NOT FOUND THEN
      IF EXISTS (SELECT 1 FROM public."User" WHERE id = p_user_id) THEN
        RETURN QUERY SELECT NULL::TEXT, 'INSUFFICIENT_BALANCE'::TEXT;
      ELSE
        RETURN QUERY SELECT NULL::TEXT, 'USER_NOT_FOUND'::TEXT;
      END IF;
      RETURN;
    END IF;

    INSERT INTO public."Transaction"(id, "userId", type, amount, description, "createdAt")
    VALUES (gen_random_uuid()::TEXT, p_user_id, 'consume', p_cost, '主報告生成', CURRENT_TIMESTAMP);
  END IF;

  v_job_id := gen_random_uuid()::TEXT;
  INSERT INTO public."ReportJob"(
    id, "archiveId", status, "currentStep", "totalSteps", "stepLabel", "createdAt", "updatedAt"
  ) VALUES (
    v_job_id, p_archive_id, 'running', 0, 6, p_step_label, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

  RETURN QUERY SELECT v_job_id, 'OK'::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_deep_report_job(
  p_user_id TEXT,
  p_archive_id TEXT,
  p_report_type TEXT,
  p_cost INTEGER,
  p_step_label TEXT,
  p_charge BOOLEAN
)
RETURNS TABLE(job_id TEXT, result TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('deep:' || p_archive_id || ':' || p_report_type));

  IF EXISTS (
    SELECT 1
    FROM public."DeepReport"
    WHERE "archiveId" = p_archive_id
      AND "reportType" = p_report_type
  ) THEN
    RETURN QUERY SELECT NULL::TEXT, 'REPORT_ALREADY_EXISTS'::TEXT;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public."DeepReportJob"
    WHERE "archiveId" = p_archive_id
      AND "reportType" = p_report_type
      AND status IN ('running', 'processing')
  ) THEN
    RETURN QUERY SELECT NULL::TEXT, 'JOB_ALREADY_RUNNING'::TEXT;
    RETURN;
  END IF;

  IF p_charge THEN
    UPDATE public."User"
    SET balance = balance - p_cost,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = p_user_id
      AND balance >= p_cost;

    IF NOT FOUND THEN
      IF EXISTS (SELECT 1 FROM public."User" WHERE id = p_user_id) THEN
        RETURN QUERY SELECT NULL::TEXT, 'INSUFFICIENT_BALANCE'::TEXT;
      ELSE
        RETURN QUERY SELECT NULL::TEXT, 'USER_NOT_FOUND'::TEXT;
      END IF;
      RETURN;
    END IF;

    INSERT INTO public."Transaction"(id, "userId", type, amount, description, "createdAt")
    VALUES (
      gen_random_uuid()::TEXT,
      p_user_id,
      'consume',
      p_cost,
      '深度報告：' || p_report_type,
      CURRENT_TIMESTAMP
    );
  END IF;

  v_job_id := gen_random_uuid()::TEXT;
  INSERT INTO public."DeepReportJob"(
    id, "archiveId", "reportType", status, "currentStep", "totalSteps", "stepLabel", "createdAt", "updatedAt"
  ) VALUES (
    v_job_id, p_archive_id, p_report_type, 'running', 0, 4, p_step_label, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  );

  RETURN QUERY SELECT v_job_id, 'OK'::TEXT;
END;
$$;
