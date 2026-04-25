'use client'

import { createContext, useContext } from 'react'

export type UserRole = 'employee' | 'manager'

export interface User {
  employeeId: string
  name: string
  role: UserRole
}

const UserContext = createContext<User | null>(null)

export function UserProvider({
  user,
  children,
}: {
  user: User
  children: React.ReactNode
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser(): User {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within a UserProvider')
  return ctx
}
