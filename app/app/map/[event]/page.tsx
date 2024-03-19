'use client'

import dynamic from 'next/dynamic'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

const DynamicMap = dynamic(() => import('@/components/map/Map'), {
  // https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading#with-no-ssr
  ssr: false,
})

export default function Page({ params }: { params: { event: string } }) {
  const supabase = createClient()
  const [data, setData] = useState<any[] | null>(null)

  useEffect(() => {
    async function loadLocations() {
      const { data, error } = await supabase
        .from('locations')
        .select()
        .eq('event_id', params.event)
        .order('created_at', { ascending: true })
      console.log({ data, error })
      setData(data)
    }
    if (!data) loadLocations()
  }, [])

  if (!data) return <div>LOADING...</div>

  return (
    <div>
      Event: {params.event}
      <div style={{ height: '675px', width: '1200px' }}>
        <DynamicMap data={data} />
      </div>
    </div>
  )
}
