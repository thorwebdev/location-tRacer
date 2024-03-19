import 'leaflet/dist/leaflet.css'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
} from 'react-leaflet'

export default async function Map({ data }: { data: any }) {
  return (
    <MapContainer
      style={{ height: '100%', width: '100%' }}
      center={[data[0].lat, data[0].long]}
      zoom={13}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline
        positions={data.map((location: any) => [location.lat, location.long])}
      />
      {data.map((location: any) => (
        <CircleMarker center={[location.lat, location.long]}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
