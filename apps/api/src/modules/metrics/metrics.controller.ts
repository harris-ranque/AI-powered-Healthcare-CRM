import { Controller, Get, Header, VERSION_NEUTRAL } from '@nestjs/common';

import { Registry, collectDefaultMetrics } from 'prom-client';

const register = new Registry();

collectDefaultMetrics({
  register,
});

// Version-neutral so Prometheus's scrape config stays stable (`/api/metrics`).
@Controller({ path: 'metrics', version: VERSION_NEUTRAL })
export class MetricsController {
  @Get()
  @Header('Content-Type', register.contentType)
  async getMetrics() {
    return register.metrics();
  }
}
