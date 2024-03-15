'use client'

import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

const DynamicMap = dynamic(() => import('../../../components/map/Map'), {
  ssr: false,
})

export default function Page({ params }: { params: { event: string } }) {
  return (
    <div>
      Event: {params.event}
      <div style={{ height: '675px', width: '1200px' }}>
        <DynamicMap />
      </div>
    </div>
  )
}
