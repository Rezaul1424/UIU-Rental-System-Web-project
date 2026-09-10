export const statusVariant = (s: string) =>
  s === 'active' ? 'success' : s === 'pending' ? 'warning' : 'danger' as const
