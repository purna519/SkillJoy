import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async indexVideo(video: any) {
    return this.elasticsearchService.index({
      index: 'videos',
      document: {
        id: video.id,
        title: video.title,
        description: video.description,
        creator: video.creator.username,
        hashtags: video.hashtags,
      },
    });
  }

  async search(text: string) {
    const { hits } = await this.elasticsearchService.search({
      index: 'videos',
      query: {
        multi_match: {
          query: text,
          fields: ['title', 'description', 'tags'],
        },
      },
    });
    return hits.hits.map((item: any) => item._source);
  }
}
