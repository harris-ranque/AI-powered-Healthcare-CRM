import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';

import { SearchService } from './search.service';

type SearchHit = {
  _id: string;
  _index: string;
  _score: number | null;
  _source: Record<string, unknown>;
};

type SearchResponseBody = {
  hits: {
    hits: SearchHit[];
  };
};

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async search(@Query('q') q: string): Promise<SearchHit[]> {
    const response = await this.searchService.getClient().search({
      index: 'patients',
      body: {
        query: {
          multi_match: {
            query: q,
            fields: ['name', 'email'],
          },
        },
      },
    });

    const body = response.body as unknown as SearchResponseBody;
    return body.hits.hits;
  }
}
