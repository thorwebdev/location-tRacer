'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import Map, { Source, Layer } from 'react-map-gl'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { default as layers } from 'protomaps-themes-base'
import { Protocol } from 'pmtiles'

import type { LineLayer } from 'react-map-gl/maplibre'
import { Database, Tables } from '@/utils/database.types'

import '@/components/map/map.css'

export default function Page({ params }: { params: { event: string } }) {
  const supabase = createClient<Database>()
  const [paths, setPaths] = useState<
    Partial<Tables<'location_paths'>>[] | null
  >(null)

  useEffect(() => {
    let protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)
    return () => {
      maplibregl.removeProtocol('pmtiles')
    }
  }, [])

  useEffect(() => {
    async function loadPaths() {
      const { data, error } = await supabase
        .from('location_paths')
        .select('user_id, geojson')
        .eq('event_id', params.event)
      console.log({ data, error })
      setPaths(data)
    }
    if (!paths) loadPaths()
  }, [])

  if (!paths) return <div>LOADING...</div>

  // TODO: make function that assign color based on user_id
  const layerStyle = ({ id }: { id: string }): LineLayer => ({
    id,
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': '#888',
      'line-width': 8,
    },
  })

  return (
    <div style={{ width: '100%' }}>
      Event: {params.event}
      <div className="map-wrap">
        <Map
          className="map"
          cooperativeGestures={true}
          initialViewState={{
            longitude: 151.265468,
            latitude: -33.870509,
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
          {paths.map((path) => (
            <Source
              key={path.user_id}
              id={`route-${path.user_id}`}
              type="geojson"
              data={{
                type: 'Feature',
                properties: {},
                geometry: JSON.parse(path.geojson!),
              }}
            >
              {/* @ts-ignore */}
              <Layer
                {...layerStyle({
                  id: `layer-${path.user_id}`,
                })}
              />
            </Source>
          ))}
        </Map>
      </div>
    </div>
  )
}
