'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useRef, useState } from 'react'
import Map, { Source, Layer, Marker, Popup } from 'react-map-gl'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { default as layers } from 'protomaps-themes-base'
import { Protocol } from 'pmtiles'

import type { LineLayer } from 'react-map-gl/maplibre'
import { Database, Tables } from '@/utils/database.types'

import '@/components/map/map.css'
import { TeamLegend } from '@/components/team-legend'

export default function Page({ params }: { params: { event: string } }) {
  const supabase = createClient<Database>()
  const [event, setEvent] = useState<Tables<'events_public'> | null>(null)
  const [paths, setPaths] = useState<
    Partial<Tables<'location_paths'>>[] | null
  >(null)
  const pathsRef = useRef<Partial<Tables<'location_paths'>>[] | null>()
  pathsRef.current = paths
  const [locations, setLocations] = useState<{
    [key: string]: Tables<'locations'>
  } | null>(null)
  const locationsRef = useRef<{
    [key: string]: Tables<'locations'>
  } | null>()
  locationsRef.current = locations

  useEffect(() => {
    let protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)
    return () => {
      maplibregl.removeProtocol('pmtiles')
    }
  }, [])

  useEffect(() => {
    async function loadEvent() {
      const { data, error } = await supabase
        .from('events_public')
        .select('*')
        .eq('id', params.event)
        .single()
      setEvent(data)
    }
    if (params.event && !event) loadEvent()
  }, [])

  async function loadPaths() {
    const { data, error } = await supabase
      .from('location_paths')
      .select('user_id, team_name, geojson, color')
      .eq('event_id', params.event)
    setPaths(data)
  }
  useEffect(() => {
    if (!paths) loadPaths()
  }, [])

  // If event is active, subscribe to realtime updates
  useEffect(() => {
    if (event?.active) {
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
            const updated = {
              ...locationsRef.current,
              [loc.user_id.toString()]: loc,
            }
            setLocations(updated)
            // Update gejson
            if (pathsRef.current?.length) {
              const cpPaths = pathsRef.current
              const i = cpPaths.findIndex((p) => p.user_id === loc.user_id)
              if (i === -1) {
                return loadPaths()
              }
              const geojson = JSON.parse(
                cpPaths[i].geojson ?? `"{"type":"LineString","coordinates":[]}"`
              )
              geojson.coordinates.push([loc.long, loc.lat])
              cpPaths[i].geojson = JSON.stringify(geojson)
              setPaths(cpPaths)
            } else {
              // Event has started, load paths.
              loadPaths()
            }
          }
        )
        .subscribe()

      return () => {
        subs.unsubscribe()
      }
    }
  }, [event])

  useEffect(() => {
    let protocol = new Protocol()
    maplibregl.addProtocol('pmtiles', protocol.tile)
    return () => {
      maplibregl.removeProtocol('pmtiles')
    }
  }, [])

  if (!event || !paths) return <div>LOADING...</div>

  // TODO: make function that assign color based on user_id
  const layerStyle = ({
    id,
    color,
  }: {
    id: string
    color: string
  }): LineLayer => ({
    id,
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      'line-color': color,
      'line-width': 8,
    },
  })

  return (
    <div style={{ width: '100%' }}>
      <div className="map-wrap">
        <Map
          className="map"
          cooperativeGestures={true}
          initialViewState={{
            longitude: event.location_latlong?.[1],
            latitude: event.location_latlong?.[0],
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
                  process.env.NEXT_PUBLIC_PROTOMAPS_URL ??
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
          {/* Draw Route */}
          {paths.map((path) => (
            <Source
              key={`source-${path.user_id}`}
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
                  color: path.color!,
                })}
              />
            </Source>
          ))}
          {/* Add realtime marker */}
          {locations &&
            Object.entries(locations).map(([key, value]) => {
              const { color, team_name } =
                paths.find((p) => p.user_id === value.user_id) ?? {}
              const time = new Date(value.created_at).toLocaleTimeString()

              return (
                <div key={`mpgroup-${key}`}>
                  <Marker
                    key={`marker-${key}`}
                    longitude={value.long}
                    latitude={value.lat}
                    color={color ?? undefined}
                  />
                  <Popup
                    key={`popup-${key}`}
                    longitude={value.long}
                    latitude={value.lat}
                    anchor="bottom"
                    closeButton={false}
                    closeOnClick={false}
                    offset={30}
                    style={{ color: '#000' }}
                  >
                    <strong>{team_name}</strong>
                    <br />
                    <i>{`(updated: ${time})`}</i>
                  </Popup>
                </div>
              )
            })}
        </Map>
      </div>
      <TeamLegend event={event.name} paths={paths} />
    </div>
  )
}
