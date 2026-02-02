export class I18n {
  enableFallback = true

  constructor(_translations?: Record<string, unknown>) {
    // no-op
  }

  t(key: string) {
    return key
  }
}
