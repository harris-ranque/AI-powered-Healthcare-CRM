import { Injectable } from '@nestjs/common';

import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class SearchService {
  private client = new Client({
    node: process.env.OPENSEARCH_URL,
  });

  getClient() {
    return this.client;
  }
}
