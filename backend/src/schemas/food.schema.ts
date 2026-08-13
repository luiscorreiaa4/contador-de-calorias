import { z } from 'zod';

// For now, we only need a schema for listing if we had query params, but currently it's a simple GET.
// Leaving it empty or just an empty object for potential future use.
export const listFoodsSchema = z.object({});
