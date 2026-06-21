import { cookies } from 'next/headers'

export type Locale = 'th' | 'en'

// อ่าน locale จาก cookie (ค่าเริ่มต้น th) — Next 16 cookies() เป็น async
export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get('lang')?.value
  return v === 'en' ? 'en' : 'th'
}

export const localeTag = (l: Locale) => (l === 'en' ? 'en-US' : 'th-TH')
