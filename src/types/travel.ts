export type TravelVisit = {
  id: string
  title: string
  cities: string[]
  startDate: string
  endDate: string
  notes: string
  rating: number
  companions: string
  budget: number | null
  createdAt: string
  updatedAt: string
}

export type CountryProfile = {
  code: string
  nameKo: string
  nameEn: string
  region: string
  capital: string
  currency: string
}

export type VisitFormData = {
  countryCode: string
  title: string
  cities: string
  startDate: string
  endDate: string
  notes: string
  rating: number
  companions: string
  budget: string
}

export type CountrySummary = CountryProfile & {
  visitCount: number
  lastVisit: string | null
  totalDays: number
  avgRating: number | null
}
