import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface CommentItem {
  id: string
  body: string
  created_at: string
  user_id: string
  author: string
  avatar_url: string | null
  image_url: string | null
}

// โหลดความคิดเห็นล่าสุดสำหรับหน้าแรก
// หมายเหตุ: ตาราง users มี RLS ให้อ่านได้เฉพาะแถวตัวเอง ดังนั้น join ตรงๆ จะคืน null
// → ดึงชื่อ/รูปผู้โพสต์ผ่าน service-role (เปิดเผยเฉพาะ full_name + avatar_url บน UI อยู่แล้ว)
// degrade gracefully: ถ้าตารางยังไม่ถูกสร้าง → คืน []
export async function getComments(limit = 50): Promise<CommentItem[]> {
  try {
    const supabase = await createClient()
    // ลองดึงพร้อม image_url ก่อน; ถ้า migration 016 ยังไม่ลง (ไม่มี column) → fallback ไม่เอา image_url
    let data: Array<Record<string, unknown>> | null = null
    const withImg = await supabase
      .from('comments')
      .select('id, body, created_at, user_id, image_url')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (withImg.error) {
      const basic = await supabase
        .from('comments')
        .select('id, body, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (basic.error || !basic.data) return []
      data = basic.data
    } else {
      data = withImg.data
    }
    if (!data || data.length === 0) return []

    const ids = [...new Set(data.map((r) => r.user_id as string))]
    const admin = createAdminClient()
    const { data: users } = await admin.from('users').select('id, full_name, avatar_url').in('id', ids)
    const byId = new Map((users ?? []).map((u) => [u.id as string, u]))

    return data.map((r) => {
      const u = byId.get(r.user_id as string) as { full_name: string; avatar_url: string | null } | undefined
      return {
        id: r.id as string,
        body: r.body as string,
        created_at: r.created_at as string,
        user_id: r.user_id as string,
        author: u?.full_name || 'สมาชิก',
        avatar_url: u?.avatar_url || null,
        image_url: (r.image_url as string) || null,
      }
    })
  } catch {
    return []
  }
}
