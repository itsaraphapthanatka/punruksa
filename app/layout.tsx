import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ปันรักษา — กองทุนรักษาสัตว์โดยชุมชน",
  description:
    "ปันรักษา — แพลตฟอร์มกองทุนรักษาสัตว์แบบโปร่งใส ด้วยระบบสุ่มอนุมัติจากสมาชิก",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={sarabun.className}>
      <body>{children}</body>
    </html>
  );
}
