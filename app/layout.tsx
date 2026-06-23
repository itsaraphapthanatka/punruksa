import type { Metadata, Viewport } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { SWRegister } from "./sw-register";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ปันรักษา — กองทุนรักษาสัตว์โดยชุมชน",
  description:
    "ปันรักษา — แพลตฟอร์มกองทุนรักษาสัตว์แบบโปร่งใส ด้วยระบบสุ่มอนุมัติจากสมาชิก",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ปันรักษา", statusBarStyle: "default" },
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
      </body>
    </html>
  );
}
