// บทบาทผู้ใช้ — แยกจากไฟล์ 'use server' (ไฟล์ server action export ได้เฉพาะ async function)
export const USER_ROLES = ['donor', 'caretaker', 'clinic', 'approver', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]
