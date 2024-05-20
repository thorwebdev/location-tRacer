import { GeistSans } from 'geist/font/sans'
import './globals.css'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

// TODO: make dynamic
export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Live Racing Location Tracker',
  description: 'Follow the Pastis Cup Race #3 Live!',
  images: [
    {
      url: 'https://mtgabtavgnhlcmbeednt.supabase.co/storage/v1/object/public/images/og/og.JPG',
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="bg-background text-foreground">
        <main className="min-h-screen flex flex-col items-center">
          {children}
        </main>
      </body>
    </html>
  )
}
