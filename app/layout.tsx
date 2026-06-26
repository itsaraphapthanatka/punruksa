import type { Metadata, Viewport } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { SWRegister } from "./sw-register";
import { VisitTracker } from "./VisitTracker";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://punruksa.petgo.asia"),
  title: "ปันรักษา — กองทุนรักษาสัตว์โดยชุมชน",
  description:
    "ปันรักษา — แพลตฟอร์มกองทุนรักษาสัตว์แบบโปร่งใส ด้วยระบบสุ่มอนุมัติจากสมาชิก",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ปันรักษา", statusBarStyle: "default" },
  openGraph: {
    title: "ปันรักษา — กองทุนรักษาสัตว์โดยชุมชน",
    description:
      "เปิดเคสขอค่ารักษา — ชุมชนสุ่มกรรมการพิจารณา โปร่งใส ตรวจสอบได้",
    url: "https://punruksa.petgo.asia",
    siteName: "ปันรักษา",
    images: [{ url: "/logo.jpg", width: 305, height: 299, alt: "ปันรักษา" }],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ปันรักษา — กองทุนรักษาสัตว์โดยชุมชน",
    description:
      "เปิดเคสขอค่ารักษา — ชุมชนสุ่มกรรมการพิจารณา โปร่งใส ตรวจสอบได้",
    images: ["/logo.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#667eea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={sarabun.className}>
      <body>
        {children}
        <SWRegister />
        <VisitTracker />
      </body>
    </html>
  );
}
