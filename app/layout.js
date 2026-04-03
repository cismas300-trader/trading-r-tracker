import "./globals.css";

export const metadata = {
  title: "Trading R Tracker",
  description: "Jurnal simplu pentru win, loss și R-multiple"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
