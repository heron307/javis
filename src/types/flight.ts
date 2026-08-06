export type TripType = 'round' | 'oneway'
export type CabinClass = 'economy' | 'premium' | 'business' | 'first'

export type Airport = {
  code: string
  nameKo: string
  nameEn: string
  cityKo: string
  countryCode: string
}

export type FlightScanQuery = {
  origin: string
  destination: string
  departDate: string
  returnDate: string
  tripType: TripType
  cabin: CabinClass
  adults: number
}

export type FlightScanRecord = FlightScanQuery & {
  id: string
  originLabel: string
  destinationLabel: string
  createdAt: string
  pinned?: boolean
}

export type FlightLink = {
  id: string
  label: string
  labelKo: string
  href: string
  kind: 'meta' | 'airline'
}
