import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchService {
  search(query: string) {
    return {
      query,
      results: [
        {
          title: 'ASUS TUF F15',
          price: 999,
          source: 'Mock Source',
        },
        {
          title: 'Lenovo LOQ',
          price: 950,
          source: 'Mock Source',
        },
        {
          title: 'Acer Nitro V',
          price: 899,
          source: 'Mock Source',
        },
      ],
    };
  }
}
