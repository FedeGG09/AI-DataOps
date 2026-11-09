/**
 * Metadatos de la versión compilada, inyectados en tiempo de build por Vite.
 * El alumno puede ver exactamente qué commit y qué rama está observando.
 * Estos valores son públicos y nunca deben incluir secretos.
 */
declare const __GUARDIAN_COMMIT__: string
declare const __GUARDIAN_BRANCH__: string
declare const __GUARDIAN_PLATFORM__: string

export const buildInfo = {
  version: '0.2.0',
  commit: __GUARDIAN_COMMIT__.slice(0, 7),
  fullCommit: __GUARDIAN_COMMIT__,
  branch: __GUARDIAN_BRANCH__,
  platform: __GUARDIAN_PLATFORM__,
}
