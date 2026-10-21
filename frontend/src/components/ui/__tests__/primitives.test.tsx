import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';
import { Badge } from '../badge';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Brutalist UI Primitives (PC-32)', () => {
  describe('Card Component', () => {
    it('deve renderizar Card com geometria brutalista (rounded-none e border-2)', () => {
      render(
        <Card data-testid="test-card">
          <CardHeader>
            <CardTitle>Título do Card</CardTitle>
            <CardDescription>Descrição do Card</CardDescription>
          </CardHeader>
          <CardContent>Conteúdo do Card</CardContent>
          <CardFooter>Rodapé do Card</CardFooter>
        </Card>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toBeInTheDocument();
      expect(card.className).toContain('rounded-none');
      expect(card.className).toContain('border-2');
      expect(card.className).toContain('border-border');
      expect(card.className).toContain('bg-card');

      const title = screen.getByText('Título do Card');
      expect(title.className).toContain('uppercase');
      expect(title.className).toContain('font-heading');
      expect(title.className).toContain('font-black');
    });
  });

  describe('Badge Component', () => {
    it('deve renderizar Badge com geometria brutalista e variantes semânticas', () => {
      render(
        <>
          <Badge data-testid="default-badge">PADRÃO</Badge>
          <Badge variant="secondary" data-testid="secondary-badge">SECUNDÁRIO</Badge>
          <Badge variant="destructive" data-testid="destructive-badge">ALERTA</Badge>
          <Badge variant="outline" data-testid="outline-badge">CONTORNO</Badge>
        </>
      );

      const defaultBadge = screen.getByTestId('default-badge');
      expect(defaultBadge.className).toContain('rounded-none');
      expect(defaultBadge.className).toContain('uppercase');
      expect(defaultBadge.className).toContain('font-bold');
      expect(defaultBadge.className).toContain('bg-primary');

      const destructiveBadge = screen.getByTestId('destructive-badge');
      expect(destructiveBadge.className).toContain('bg-destructive');
      expect(destructiveBadge.className).toContain('rounded-none');
    });
  });

  describe('Alert Component', () => {
    it('deve renderizar Alert com role="alert" e estilo brutalista', () => {
      render(
        <Alert variant="destructive" data-testid="test-alert">
          <AlertTitle>ATENÇÃO</AlertTitle>
          <AlertDescription>Mensagem de teste de erro</AlertDescription>
        </Alert>
      );

      const alert = screen.getByTestId('test-alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert.className).toContain('rounded-none');
      expect(alert.className).toContain('border-2');
      expect(alert.className).toContain('border-destructive');

      const title = screen.getByText('ATENÇÃO');
      expect(title.className).toContain('font-heading');
      expect(title.className).toContain('uppercase');
    });
  });
});
