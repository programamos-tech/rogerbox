/**
 * Factory de query keys para TanStack Query.
 * Centraliza las claves para evitar strings mágicos y facilitar invalidación.
 */
export const queryKeys = {
  all: ['rogerbox'] as const,
  courses: () => [...queryKeys.all, 'courses'] as const,
  course: (id: string) => [...queryKeys.courses(), id] as const,
  userPurchases: (userId?: string) =>
    [...queryKeys.all, 'purchases', userId ?? 'current'] as const,
  userCourse: (userId: string, courseId: string) =>
    [...queryKeys.userPurchases(userId), 'course', courseId] as const,
} as const;
