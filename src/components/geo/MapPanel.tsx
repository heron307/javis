import { mapsDirectionsUrl, mapsEmbedUrl, mapsSearchUrl } from '../../lib/geoStorage'
import type { GeoPlace } from '../../types/geo'

type Props = {
  place: Pick<GeoPlace, 'name' | 'nameEn' | 'address' | 'lat' | 'lng' | 'city'>
  compact?: boolean
}

export function MapPanel({ place, compact = false }: Props) {
  const embed = mapsEmbedUrl(place)
  const search = mapsSearchUrl(place)
  const directions = mapsDirectionsUrl(place)

  return (
    <div className={`map-embed-wrap${compact ? ' compact' : ''}`}>
      <div className="map-embed-frame">
        <iframe
          title={`Map · ${place.name}`}
          src={embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="map-embed-actions">
        <a className="btn-ghost" href={search} target="_blank" rel="noreferrer">
          Open Maps
        </a>
        <a className="btn-ghost" href={directions} target="_blank" rel="noreferrer">
          Directions
        </a>
      </div>
    </div>
  )
}
