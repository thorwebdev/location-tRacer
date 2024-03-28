'use client'

import { useEffect } from 'react'
import Map from 'react-map-gl'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { default as layers } from 'protomaps-themes-base'
import { Protocol } from 'pmtiles'

export default function Page() {
  useEffect(() => {
    let protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)
    return () => {
      maplibregl.removeProtocol('pmtiles')
    }
  }, [])

  return (
    <div className="App">
      <Map
        style={{ width: 600, height: 400 }}
        mapStyle={{
          version: 8,
          glyphs:
            'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
          sources: {
            protomaps: {
              attribution:
                '<a href="https://github.com/protomaps/basemaps">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
              type: 'vector',
              url: 'pmtiles://https://jkcrtymvpupiodvysjce.supabase.co/functions/v1/maps-private/singapore_oc.pmtiles',
            },
          },
          layers: layers('protomaps', 'light'),
        }}
        mapLib={maplibregl}
      />
    </div>
  )
}
