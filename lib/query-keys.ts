export const queryKeys = {
  balance: (employeeId: string, locationId: string) =>
    ['balance', employeeId, locationId] as const,

  balances: () =>
    ['balances'] as const,

  requests: () =>
    ['requests'] as const,

  request: (requestId: string) =>
    ['requests', requestId] as const,
}
