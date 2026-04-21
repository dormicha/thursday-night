import { Noto_Sans_Hebrew } from "next/font/google";

const notoSansHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  variable: "--font-noto-hebrew",
  display: "swap",
});

export default function RoomRoutesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      dir="rtl"
      lang="he"
      className={`${notoSansHebrew.className} min-h-full`}
    >
      {children}
    </div>
  );
}
