import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import SidebarLayout from './layout/SidebarLayout'
import LoginPage from './pages/LoginPage'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Anomalies from './pages/Anomalies'
import AnomalyDetail from './pages/AnomalyDetail'
import Transactions from './pages/Transactions'
import Vault from './pages/Vault'
import Analysis from './pages/Analysis'
import Activity from './pages/Activity'
import Messaging from './pages/Messaging'
import Settings from './pages/Settings'
import System from './pages/System'
import FleetManagement from './pages/FleetManagement'
import AccessLogs from './pages/AccessLogs'
import AccessControl from './pages/AccessControl'
import GlobalFeed from './pages/GlobalFeed'
import Integrations from './pages/Integrations'
import Performance from './pages/Performance'
import Reporting from './pages/Reporting'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="border-[3px] border-primary bg-surface-container-lowest p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-mono text-sm uppercase animate-pulse">Initializing...</p>
      </div>
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ErrorBoundary>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/anomalies" element={<Anomalies />} />
                <Route path="/anomaly/:id" element={<AnomalyDetail />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/ledger" element={<Transactions />} />
                <Route path="/vault" element={<Vault />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/messaging" element={<Messaging />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/system" element={<System />} />
                <Route path="/fleet" element={<FleetManagement />} />
                <Route path="/access-logs" element={<AccessLogs />} />
                <Route path="/access-control" element={<AccessControl />} />
                <Route path="/global-feed" element={<GlobalFeed />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/reporting" element={<Reporting />} />
              </Route>
            </Routes>
          </AuthProvider>
          </ErrorBoundary>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
