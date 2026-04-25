import { UserProvider } from '@/contexts/UserContext'

// Hardcoded manager identity for Phase 4 — auth/session deferred to Phase 7
export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider user={{ employeeId: 'mgr-001', name: 'Sam Rivera', role: 'manager' }}>
      {children}
    </UserProvider>
  )
}
