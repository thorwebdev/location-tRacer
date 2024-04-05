'use client'

import { createClient } from '@/utils/supabase/client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Marker } from 'react-map-gl'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { default as layers } from 'protomaps-themes-base'
import { Protocol } from 'pmtiles'

import { Database, Tables } from '@/utils/database.types'

import '@/components/map/map.css'

export default function Page({ params }: { params: { event: string } }) {
  const supabase = createClient<Database>()
  const [locations, setLocations] = useState<{
    [key: string]: Tables<'locations'>
  } | null>(null)

  useEffect(() => {
    // TODO Fetch route
    // Listen to realtime updates
    const subs = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Listen only to INSERTs
          schema: 'public',
          table: 'locations',
          filter: `event_id=eq.${params.event}`,
        },
        (payload) => {
          const loc = payload.new as Tables<'locations'>
          const updated = { ...locations, [loc.user_id.toString()]: loc }
          console.log(updated)
          setLocations(updated)
        }
      )
      .subscribe()
    console.log('Subscribed')

    return () => {
      subs.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)
    return () => {
      maplibregl.removeProtocol('pmtiles')
    }
  }, [])

  // TODO: figure out dynamic marker
  const markerRef = useRef<maplibregl.Marker | undefined>()

  const popup = useMemo(() => {
    return new maplibregl.Popup().setText('Hello world!')
  }, [])

  const togglePopup = useCallback(() => {
    markerRef.current?.togglePopup()
  }, [])

  if (!locations) return <div>WAITING FOR UPDATES...</div>

  return (
    <div style={{ width: '100%' }}>
      Event: {params.event}
      <div className="map-wrap">
        <Map
          className="map"
          cooperativeGestures={true}
          initialViewState={{
            longitude: 103.852713,
            latitude: 1.285727,
            zoom: 13,
          }}
          mapStyle={{
            version: 8,
            glyphs:
              'https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf',
            sources: {
              protomaps: {
                type: 'vector',
                tiles: [
                  'https://api.protomaps.com/tiles/v3/{z}/{x}/{y}.mvt?key=e6cd5633d51d8e24',
                ],
                maxzoom: 15,
              },
            },
            transition: {
              duration: 0,
            },
            // @ts-ignore
            layers: layers('protomaps', 'light'),
          }}
          // @ts-ignore
          mapLib={maplibregl}
        >
          {Object.entries(locations).map(([key, value]) => (
            <Marker
              key={key}
              longitude={value.long}
              latitude={value.lat}
              color="red"
              // popup={popup}
              // ref={markerRef}
            />
          ))}
        </Map>
      </div>
    </div>
  )
}
