import { Logger } from '@nestjs/common';

export function logSecurityEvent(
  logger: Logger,
  event: string,
  metadata?: Record<string, unknown>,
): void {
  logger.log(
    JSON.stringify({
      type: 'SECURITY_EVENT',
      event,
      metadata,
      timestamp: new Date().toISOString(),
    }),
  );
}
