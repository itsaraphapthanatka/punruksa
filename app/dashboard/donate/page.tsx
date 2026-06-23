import { redirect } from 'next/navigation'

// การบริจาคย้ายไปหน้าสาธารณะ /donate (ไม่ต้องล็อกอิน)
export default function DashboardDonateRedirect() {
  redirect('/donate')
}
