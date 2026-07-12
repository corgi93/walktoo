import { QueryKey, UseQueryOptions } from '@tanstack/react-query';

export type QueryConfig<TData, TResult> = Omit<
  UseQueryOptions<TData, Error, TResult, QueryKey>,
  'queryKey' | 'queryFn'
>;

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
