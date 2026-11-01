import React from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg border-2 border-border bg-card p-8 sm:p-12 shadow-hard text-center space-y-6 animate-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground border-2 border-edge shadow-hard">
          <Compass className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="text-6xl font-heading font-black tracking-tighter text-primary-ink">
            404
          </p>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground uppercase">
            Página Não Encontrada
          </h1>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            O endereço solicitado não existe, foi removido ou nunca existiu.
          </p>
        </div>

        <div className="pt-4 border-t-2 border-border flex justify-center">
          <Button asChild variant="default" className="gap-2">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Voltar ao Início
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

