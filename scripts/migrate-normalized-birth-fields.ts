/**
 * 批量更新现有档案的标准化出生信息字段
 * 
 * 执行步骤：
 * 1. 先运行 migrations/add_normalized_birth_fields.sql 添加字段和索引
 * 2. 然后运行此脚本批量填充现有数据：
 *    npx tsx scripts/migrate-normalized-birth-fields.ts
 * 
 * 环境变量要求（从 .env.local 自动加载）：
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { normalizeBirthInfo } from '../src/lib/services/birth-normalizer'
import type { ApiArchive } from '../src/lib/types/api'

// 读取 .env.local 文件
function loadEnvLocal(): void {
  try {
    const envPath = join(__dirname, '..', '.env.local')
    const envContent = readFileSync(envPath, 'utf-8')
    const lines = envContent.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value
        }
      }
    }
  } catch (error) {
    // .env.local 不存在或读取失败，使用已设置的环境变量
    console.warn('警告: 无法读取 .env.local，将使用已设置的环境变量')
  }
}

// 加载环境变量
loadEnvLocal()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('请设置环境变量：')
  console.error('  NEXT_PUBLIC_SUPABASE_URL')
  console.error('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const client = createClient(supabaseUrl, supabaseServiceKey)

function rowToArchive(row: Record<string, unknown>): ApiArchive {
  const a: ApiArchive = {
    id: row.id as string,
    userId: row.userId as string,
    name: row.name as string,
    gender: row.gender as 'male' | 'female',
    birthDate: (row.birthDate as string).replace('Z', '').slice(0, 19),
    birthLocation: ((row.birthLocation as string) ?? '') || '',
    createdAt: (row.createdAt as string).replace('Z', '').slice(0, 19),
  }
  if (row.birthCalendar) a.birthCalendar = row.birthCalendar as 'solar' | 'lunar'
  if (row.birthTimeMode) a.birthTimeMode = row.birthTimeMode as 'datetime' | 'shichen'
  if (row.birthTimeBranch != null) a.birthTimeBranch = row.birthTimeBranch as number
  if (row.lunarDate) a.lunarDate = row.lunarDate as string
  if (row.isLeapMonth != null) a.isLeapMonth = row.isLeapMonth as boolean
  return a
}

async function migrateArchives() {
  console.log('开始批量更新档案的标准化字段...\n')

  // 1. 查询所有需要更新的档案（normalized_birth_date 为 NULL 的）
  // 注意：Supabase JS 客户端会将 camelCase 转换为 snake_case，但查询条件需要使用 snake_case
  const { data: archives, error: fetchError } = await client
    .from('Archive')
    .select('*')
    .is('normalized_birth_date', null)
    .order('createdAt', { ascending: true })

  if (fetchError) {
    console.error('查询档案失败:', fetchError.message)
    process.exit(1)
  }

  if (!archives || archives.length === 0) {
    console.log('没有需要更新的档案（所有档案都已包含标准化字段）')
    return
  }

  console.log(`找到 ${archives.length} 个需要更新的档案\n`)

  let successCount = 0
  let errorCount = 0
  const errors: Array<{ id: string; name: string; error: string }> = []

  // 2. 批量处理（每次处理一个，避免内存问题）
  for (let i = 0; i < archives.length; i++) {
    const row = archives[i]
    const archive = rowToArchive(row)

    try {
      // 计算标准化字段
      const normalized = normalizeBirthInfo(archive)

      // 更新数据库（使用 snake_case 列名）
      const { error: updateError } = await client
        .from('Archive')
        .update({
          normalized_birth_date: normalized.normalizedBirthDate,
          normalized_time_index: normalized.normalizedTimeIndex,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', archive.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      successCount++
      if ((i + 1) % 10 === 0 || i === archives.length - 1) {
        console.log(`进度: ${i + 1}/${archives.length} (成功: ${successCount}, 失败: ${errorCount})`)
      }
    } catch (error) {
      errorCount++
      const errorMsg = error instanceof Error ? error.message : String(error)
      errors.push({
        id: archive.id,
        name: archive.name,
        error: errorMsg,
      })
      console.error(`档案 "${archive.name}" (${archive.id}) 更新失败:`, errorMsg)
    }
  }

  // 3. 输出结果
  console.log('\n' + '='.repeat(60))
  console.log('批量更新完成！')
  console.log(`总计: ${archives.length} 个档案`)
  console.log(`成功: ${successCount} 个`)
  console.log(`失败: ${errorCount} 个`)

  if (errors.length > 0) {
    console.log('\n失败的档案:')
    errors.forEach(({ id, name, error }) => {
      console.log(`  - ${name} (${id}): ${error}`)
    })
  }

  console.log('='.repeat(60))
}

// 执行迁移
migrateArchives()
  .then(() => {
    console.log('\n迁移完成！')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n迁移失败:', error)
    process.exit(1)
  })
