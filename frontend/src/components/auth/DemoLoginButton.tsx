import React from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { demoLogin } from '../../services/auth.service';
import { Button, type ButtonProps } from '../ui/button';

/** Cria uma conta temporária de visitante e entra, sem cadastro (para quem só quer conhecer o app). */
export const DemoLoginButton: React.FC<Pick<ButtonProps, 'size' | 'variant' | 'className'>> = (
  props,
) => {
  const { setAuthSession } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: demoLogin,
    onSuccess: (response) => {
      queryClient.clear(); // não vaza o cache de uma sessão anterior
      setAuthSession(response.user, false);
      navigate('/app');
    },
  });

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        {...props}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <Eye className="mr-2 h-5 w-5" aria-hidden="true" />
        )}
        Ver demonstração
      </Button>
      <p className="text-xs text-muted-foreground">Conta temporária, apagada em 24 h.</p>
      {mutation.isError && (
        <p role="alert" className="text-xs font-bold uppercase text-destructive">
          {mutation.error.message || 'Demonstração indisponível no momento.'}
        </p>
      )}
    </div>
  );
};
