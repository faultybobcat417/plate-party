import { Platform } from "react-native";

let Sentry: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Sentry = require("@sentry/react-native");
} catch {
  // Sentry not installed
}

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const RELEASE = process.env.EXPO_PUBLIC_APP_VERSION ?? "1.0.0";
const ENV = process.env.NODE_ENV ?? "development";

export function initSentry(): void {
  if (!Sentry || !DSN) return;

  Sentry.init({
    dsn: DSN,
    release: `${Platform.OS}@${RELEASE}`,
    environment: ENV,
    beforeSend(event: any) {
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!Sentry) return;
  Sentry.withScope((scope: any) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

export function addBreadcrumb(
  category: string,
  message: string,
  level: "info" | "warning" | "error" = "info",
  data?: Record<string, unknown>,
): void {
  if (!Sentry) return;
  Sentry.addBreadcrumb({ category, message, level, data: data ?? {} });
}

export function setUserContext(userId: string | null, username?: string | null): void {
  if (!Sentry) return;
  if (userId) {
    Sentry.setUser({ id: userId, username: username ?? undefined });
  } else {
    Sentry.setUser(null);
  }
}
