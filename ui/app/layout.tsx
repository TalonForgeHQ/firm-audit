export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#eee', fontFamily: 'ui-monospace, Menlo, monospace' }}>
        {children}
      </body>
    </html>
  );
}