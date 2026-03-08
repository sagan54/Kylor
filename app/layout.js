export const metadata = {
  title: "Kylor AI",
  description: "Kylor AI cinematic production engine",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}