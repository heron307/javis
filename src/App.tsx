import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { LandingPage } from './pages/LandingPage'
import { TravelLogPage } from './pages/TravelLogPage'
import { CountryDetailPage } from './pages/CountryDetailPage'
import { GeoIntelPage } from './pages/GeoIntelPage'
import { GeoCountryPage } from './pages/GeoCountryPage'
import { FlightScanPage } from './pages/FlightScanPage'
import { StayScanPage } from './pages/StayScanPage'
import { MissionPlanPage } from './pages/MissionPlanPage'
import { MissionDetailPage } from './pages/MissionDetailPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/logs" element={<TravelLogPage />} />
          <Route path="/logs/:code" element={<CountryDetailPage />} />
          <Route path="/missions" element={<MissionPlanPage />} />
          <Route path="/missions/:id" element={<MissionDetailPage />} />
          <Route path="/geo" element={<GeoIntelPage />} />
          <Route path="/geo/:code" element={<GeoCountryPage />} />
          <Route path="/flights" element={<FlightScanPage />} />
          <Route path="/stays" element={<StayScanPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
