import { UserProvider } from '@/contexts/UserContext'

// Hardcoded to Alice for Phase 3 — Phase 4 will introduce auth/session lookup
export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider user={{ employeeId: 'emp-alice', name: 'Alice Johnson', role: 'employee' }}>
      {children}
    </UserProvider>
  )
}
