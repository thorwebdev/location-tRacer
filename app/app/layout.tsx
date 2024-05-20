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
  openGraph: {
    images: [
      'https://mtgabtavgnhlcmbeednt.supabase.co/storage/v1/object/public/images/og/og.JPG',
    ],
  },
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
        <div className="fixed bottom-0 right-0 bg-gray-900 text-white px-4 py-2 flex items-center gap-2">
          <a className="text-sm hover:underline" href="https://thor.bio">
            © 2024 THORWEBDEV
          </a>
          <a className="text-sm hover:underline" href="https://t.me/thorwebdev">
            Contact
          </a>
        </div>
      </body>
    </html>
  )
}
