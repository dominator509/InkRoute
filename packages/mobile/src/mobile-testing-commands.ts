export const mobileTestingExecutionCommands = [
  "pnpm --filter @inkroute/mobile-support typecheck",
  "pnpm --filter @inkroute/mobile-support test",
  "pnpm --filter @inkroute/mobile typecheck",
  "pnpm --filter @inkroute/mobile test",
  "pnpm --filter @inkroute/mobile ios",
  "pnpm --filter @inkroute/mobile android",
  "eas build --profile preview --platform all",
  "eas update --channel preview",
  "eas update --channel preview --message rollback-republish-drill --non-interactive",
  "manual physical-device QA for auth/api/offline/push/crash/OTA/accessibility",
  "GitHub Actions mobile testing execution job",
] as const;
