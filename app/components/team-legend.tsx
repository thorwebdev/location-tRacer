/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/8YeBIyE1udg
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */

/** Add fonts into your Next.js project:

import { Inter } from 'next/font/google'

inter({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/
import { Tables } from '@/utils/database.types'

export function TeamLegend({
  paths,
  event,
}: {
  event: string | null
  paths?: Partial<Tables<'location_paths'>>[]
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0  h-36 overflow-y-scroll bg-gray-900 text-white py-6 px-4 md:px-6">
      <h3 className="text-lg font-semibold">{event ?? 'LOADING...'}</h3>
      <ul className="space-y-1 list-none grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-8">
        {paths?.length
          ? paths.map((path) => (
              <li
                key={path.user_id}
                className="flex items-center space-y-2 gap-2"
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: path.color ?? '' }}
                />
                <span>{path.team_name}</span>
              </li>
            ))
          : ''}
      </ul>
    </div>
  )
}
