import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';
import { queryClient } from './tests/setup/test-utils';

configure({ asyncUtilTimeout: 5000 });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  queryClient.clear();
});
afterAll(() => server.close());
