import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Levi ChatBot',
  description: 'Created by Adityaa Mehra',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
