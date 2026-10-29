import './globals.css';

export const metadata = {
  title: 'Site Yönetim Paneli',
  description: '3 Bloklu Site Yönetim Sistemi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}