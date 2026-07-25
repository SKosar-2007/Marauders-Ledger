import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import SidebarNav from './components/SidebarNav'
import CommandPalette from './components/CommandPalette'
import ScrollToTop from './components/ScrollToTop'
import DarkModeToggle from './components/DarkModeToggle'

const Landing = lazy(() => import('./pages/Landing'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AnomalyDetail = lazy(() => import('./pages/AnomalyDetail'))
const MischiefList = lazy(() => import('./pages/MischiefList'))
const Vault = lazy(() => import('./pages/Vault'))
const Pensieve = lazy(() => import('./pages/Pensieve'))
const OwlPost = lazy(() => import('./pages/OwlPost'))
const Profile = lazy(() => import('./pages/Profile'))
const DailyProphet = lazy(() => import('./pages/DailyProphet'))
const Owlry = lazy(() => import('./pages/Owlry'))
const RestrictedSection = lazy(() => import('./pages/RestrictedSection'))
const PatronusRegistry = lazy(() => import('./pages/PatronusRegistry'))
const OEA = lazy(() => import('./pages/OEA'))
const RoomOfWorkspace = lazy(() => import('./pages/RoomOfWorkspace'))
const AdminSettings = lazy(() => import('./pages/AdminSettings'))
const GreatHall = lazy(() => import('./pages/GreatHall'))
const DuelingArena = lazy(() => import('./pages/DuelingArena'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function Loading() {
  return (
    <div className="min-h-screen ml-[72px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#735c00] border-t-transparent rounded-full animate-spin" />
        <p className="font-crimson text-sm text-[#504440] italic">Unfolding the Map...</p>
      </div>
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <Suspense fallback={<Loading />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/anomaly/:id" element={<AnomalyDetail />} />
          <Route path="/ledger" element={<MischiefList />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/pensieve" element={<Pensieve />} />
          <Route path="/owl-post" element={<OwlPost />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/daily-prophet" element={<DailyProphet />} />
          <Route path="/owlry" element={<Owlry />} />
          <Route path="/restricted-section" element={<RestrictedSection />} />
          <Route path="/patronus-registry" element={<PatronusRegistry />} />
          <Route path="/oea" element={<OEA />} />
          <Route path="/room-of-requirement" element={<RoomOfWorkspace />} />
          <Route path="/admin" element={<AdminSettings />} />
          <Route path="/great-hall" element={<GreatHall />} />
          <Route path="/dueling-arena" element={<DuelingArena />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <ToastProvider>
            <SidebarNav />
            <CommandPalette />
            <ScrollToTop />
            <DarkModeToggle />
            <AnimatedRoutes />
          </ToastProvider>
        </AppProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
