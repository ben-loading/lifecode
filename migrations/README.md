# 数据库迁移说明

## 迁移：添加标准化出生信息字段（同命盘报告复用）

### 执行步骤

#### 1. 执行 SQL 迁移（添加字段和索引）

**方式一：通过 Supabase Dashboard**
1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 复制 `add_normalized_birth_fields.sql` 的内容
5. 粘贴到 SQL Editor 中
6. 点击 **Run** 执行

**方式二：通过 Supabase CLI**
```bash
# 如果已安装 Supabase CLI
supabase db push

# 或者直接执行 SQL
psql $DATABASE_URL -f migrations/add_normalized_birth_fields.sql
```

**方式三：通过 Node.js 脚本**
```bash
# 创建一个临时脚本执行 SQL
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const sql = fs.readFileSync('migrations/add_normalized_birth_fields.sql', 'utf8');
// 注意：Supabase JS 客户端不直接支持执行原始 SQL，建议使用 Dashboard 或 CLI
"
```

#### 2. 批量更新现有档案数据

执行 TypeScript 脚本批量填充现有档案的标准化字段：

```bash
# 确保已设置环境变量（从 .env.local 加载）
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 或者使用 dotenv（如果已安装）
npx dotenv -e .env.local -- npx tsx scripts/migrate-normalized-birth-fields.ts

# 或者直接运行（需要先设置环境变量）
npx tsx scripts/migrate-normalized-birth-fields.ts
```

### 验证迁移结果

执行以下 SQL 查询验证：

```sql
-- 检查字段是否添加成功
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'Archive' 
  AND column_name IN ('normalized_birth_date', 'normalized_time_index');

-- 检查索引是否创建成功
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename = 'Archive' 
  AND indexname = 'idx_archive_normalized_birth';

-- 检查有多少档案已填充标准化字段
SELECT 
  COUNT(*) as total,
  COUNT(normalized_birth_date) as with_normalized_date,
  COUNT(normalized_time_index) as with_normalized_time
FROM public."Archive";
```

### 回滚（如果需要）

如果需要回滚迁移：

```sql
-- 删除索引
DROP INDEX IF EXISTS public.idx_archive_normalized_birth;

-- 删除字段
ALTER TABLE public."Archive" 
  DROP COLUMN IF EXISTS normalized_birth_date,
  DROP COLUMN IF EXISTS normalized_time_index;
```

### 注意事项

1. **备份数据**：在执行迁移前，建议先备份数据库
2. **测试环境**：先在测试环境执行，验证无误后再在生产环境执行
3. **批量更新**：如果档案数量很大，批量更新脚本会逐个处理，可能需要一些时间
4. **错误处理**：脚本会记录所有失败的情况，可以后续手动修复

### 后续维护

- 新创建的档案会自动填充标准化字段（通过 `createArchive` 函数）
- 如果修改了档案的出生信息，需要手动更新标准化字段（或通过 API 触发更新）
