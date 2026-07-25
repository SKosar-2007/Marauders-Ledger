import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import SidebarNav from './components/SidebarNav'
import CommandPalette from './components/CommandPalette'
import ScrollToTop from './components/ScrollToTop'
import DarkModeToggle from './components/DarkModeToggle'
import Onboarding from './components/Onboarding'
import KeyboardShortcuts from './components/KeyboardShortcuts'

const LoginPage = lazy(() => import('./pages/LoginPage'))
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <Suspense fallback={<Loading />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/anomaly/:id" element={<ProtectedRoute><AnomalyDetail /></ProtectedRoute>} />
          <Route path="/ledger" element={<ProtectedRoute><MischiefList /></ProtectedRoute>} />
          <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
          <Route path="/pensieve" element={<ProtectedRoute><Pensieve /></ProtectedRoute>} />
          <Route path="/owl-post" element={<ProtectedRoute><OwlPost /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/daily-prophet" element={<ProtectedRoute><DailyProphet /></ProtectedRoute>} />
          <Route path="/owlry" element={<ProtectedRoute><Owlry /></ProtectedRoute>} />
          <Route path="/restricted-section" element={<ProtectedRoute><RestrictedSection /></ProtectedRoute>} />
          <Route path="/patronus-registry" element={<ProtectedRoute><PatronusRegistry /></ProtectedRoute>} />
          <Route path="/oea" element={<ProtectedRoute><OEA /></ProtectedRoute>} />
          <Route path="/room-of-requirement" element={<ProtectedRoute><RoomOfWorkspace /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          <Route path="/great-hall" element={<ProtectedRoute><GreatHall /></ProtectedRoute>} />
          <Route path="/dueling-arena" element={<ProtectedRoute><DuelingArena /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <AppProvider>
              <SidebarNav />
              <Onboarding />
              <CommandPalette />
              <ScrollToTop />
              <DarkModeToggle />
              <KeyboardShortcuts />
              <AnimatedRoutes />
            </AppProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
