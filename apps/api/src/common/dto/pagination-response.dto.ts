import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Number of items per page' })
  limit!: number;

  @ApiProperty({ example: 100, description: 'Total number of items' })
  total!: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  pages!: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items' })
  items!: T[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta!: PaginationMeta;

  static create<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponseDto<T> {
    const response = new PaginatedResponseDto<T>();
    response.items = items;
    response.meta = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
    return response;
  }
}
