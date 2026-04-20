import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Kylor AI",
  description: "Kylor AI cinematic production engine",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#050816] text-white min-h-screen w-full`}>
        {children}
      </body>
    </html>
  );
}