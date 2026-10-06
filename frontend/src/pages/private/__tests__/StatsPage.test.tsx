import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatsPage } from '../StatsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('StatsPage', () => {
  it('renders loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <StatsPage />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Carregando estatísticas/i)).toBeInTheDocument();
  });
});
