import { Injectable } from '@nestjs/common';

import { randomBytes } from 'crypto';

@Injectable()
export class ApiKeysService {
  generateKey() {
    return 'hc_' + randomBytes(32).toString('hex');
  }
}
