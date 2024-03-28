import maplibregl from 'maplibre-gl'
import { default as layers } from 'protomaps-themes-base'
import { useEffect, useRef, useState } from 'react'

import 'maplibre-gl/dist/maplibre-gl.css'
import './map.css'

export default async function MapContainer({
  locations,
}: {
  locations: Array<{ lat: number; long: number }>
}) {
  const mapContainer = useRef<any>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [lng] = useState(locations[0].long)
  const [lat] = useState(locations[0].lat)
  const [zoom] = useState(13)

  const style = (): maplibregl.StyleSpecification => {
    return {
      version: 8,
      glyphs: 'https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf',
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
      layers: layers('protomaps', 'light'),
    }
  }

  useEffect(() => {
    if (map.current) return // stops map from intializing more than once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: style(),
      cooperativeGestures: true,
      center: [lng, lat],
      zoom: zoom,
    })

    // Draw markers
    // locations.map((loc) =>
    //   new maplibregl.Marker().setLngLat([loc.long, loc.lat]).addTo(map.current)
    // )

    // Draw line
    map.current.on('load', (mapEvent) => {
      const map = mapEvent.target
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: locations.map((loc) => [loc.long, loc.lat]),
          },
        },
      })
      map.addLayer({
        id: 'route',
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
    })
  }, [lng, lat, zoom])

  return (
    <div className="map-wrap">
      <div ref={mapContainer} className="map" />
    </div>
  )
}
