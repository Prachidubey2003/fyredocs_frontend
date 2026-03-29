// Guest token is now handled via httpOnly cookie set by the backend.
// These are no-ops kept for backwards compatibility during the transition.

export function getGuestToken(): string | null {
  return null;
}

export function setGuestToken(_token: string): void {
  // no-op: cookie is set by the backend response automatically
}
