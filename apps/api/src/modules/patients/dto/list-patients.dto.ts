import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const PATIENT_SORT_FIELDS = [
  'lastName',
  'firstName',
  'email',
  'createdAt',
] as const;
export type PatientSortField = (typeof PATIENT_SORT_FIELDS)[number];

export const PATIENT_SORT_ORDERS = ['asc', 'desc'] as const;
export type PatientSortOrder = (typeof PATIENT_SORT_ORDERS)[number];

export class ListPatientsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  search?: string;

  /**
   * When true, soft-deleted patients are included in the result. Defaults to
   * false so consumers don't accidentally surface deleted records.
   * Accepts `'true' | 'false' | '1' | '0'` from the query string.
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  })
  @IsBoolean()
  includeDeleted: boolean = false;

  @IsOptional()
  @IsIn(PATIENT_SORT_FIELDS)
  sortBy: PatientSortField = 'lastName';

  @IsOptional()
  @IsIn(PATIENT_SORT_ORDERS)
  order: PatientSortOrder = 'asc';
}
