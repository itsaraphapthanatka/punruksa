import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ปันรักษา — กองทุนรักษาสัตว์โดยชุมชน',
    short_name: 'ปันรักษา',
    description: 'กองทุนรักษาสัตว์แบบโปร่งใส ด้วยระบบสุ่มอนุมัติจากสมาชิก',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#667eea',
    lang: 'th',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
