/**
 * Activity event catalog for the web client.
 *
 * Names are lowercase `domain.action`, matching the backend catalog in
 * analytics-service/internal/activity/catalog.go — the server validates the
 * domain against an allowlist, so a new event here must stay inside an
 * approved domain (auth, job, upload, document, annotation, signature, scan,
 * ocr, share, settings, session, backup, plan, admin) or ingest will reject it.
 */

export const ACTIVITY_EVENTS = {
  authLogin: 'auth.login',
  authLogout: 'auth.logout',
  authSignup: 'auth.signup',

  jobStarted: 'job.started',
  jobCompleted: 'job.completed',
  jobFailed: 'job.failed',
  jobCancelled: 'job.cancelled',

  uploadCompleted: 'upload.completed',
  uploadFailed: 'upload.failed',

  shareLinkCreated: 'share.link_created',
  shareLinkRevoked: 'share.link_revoked',

  settingsChanged: 'settings.changed',
} as const;

export type ActivityEventType =
  (typeof ACTIVITY_EVENTS)[keyof typeof ACTIVITY_EVENTS];

export type ActivityStatus = 'started' | 'success' | 'failed' | 'cancelled';
