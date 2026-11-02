import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useProfileQuery } from '../../hooks/useProfileSettings';
import { disableMfa, enableMfa, setupMfa } from '../../services/auth.service';

const field =
  'w-full h-12 px-3 bg-background border-2 border-border rounded-none font-mono tracking-widest text-foreground focus:border-ring focus:outline-none';
const btn =
  'border-2 border-border px-4 py-3 font-black text-xs uppercase hover:bg-secondary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/** Ativação/desativação do MFA (TOTP). Sem QR: o segredo é digitado no app autenticador. */
export function MfaCard() {
  const queryClient = useQueryClient();
  const profile = useProfileQuery();
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const { user, updateUserSession } = useAuth();
  const refresh = (mfa_enabled: boolean) => {
    // Mantém o contexto em sincronia: AdminRoute lê `mfa_enabled` daqui.
    if (user) updateUserSession({ ...user, mfa_enabled });
    return queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
  };

  const setup = useMutation({ mutationFn: setupMfa });
  const enable = useMutation({
    mutationFn: enableMfa,
    onSuccess: (data) => {
      setRecovery(data.recovery_codes);
      setCode('');
      setup.reset();
      refresh(true);
    },
  });
  const disable = useMutation({
    mutationFn: disableMfa,
    onSuccess: () => {
      setCode('');
      refresh(false);
    },
  });

  const enabled = !!profile.data?.mfa_enabled;
  const error = (setup.error ?? enable.error ?? disable.error)?.message;

  return (
    <section
      className="border-2 border-border bg-card p-6 shadow-hard space-y-4"
      aria-labelledby="mfa-title"
    >
      <h2 id="mfa-title" className="font-heading font-black text-xl uppercase">
        VERIFICAÇÃO EM DUAS ETAPAS
      </h2>

      {profile.isPending && <p className="font-bold uppercase text-xs">CARREGANDO...</p>}
      {profile.isError && (
        <p role="alert" className="text-destructive">
          Não foi possível carregar o estado do MFA.
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}

      {recovery && (
        <div role="status" className="border-2 border-border p-4 space-y-2">
          <p className="font-bold uppercase text-xs">
            GUARDE ESTES CÓDIGOS DE RECUPERAÇÃO. ELES NÃO SERÃO EXIBIDOS DE NOVO.
          </p>
          <ul className="font-mono grid grid-cols-2 gap-1">
            {recovery.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button type="button" className={btn} onClick={() => setRecovery(null)}>
            JÁ GUARDEI
          </button>
        </div>
      )}

      {profile.data && !enabled && !setup.data && (
        <>
          <p className="text-muted-foreground">
            Proteja a conta com um código gerado por um app autenticador.
          </p>
          <button
            type="button"
            className={btn}
            disabled={setup.isPending}
            onClick={() => setup.mutate()}
          >
            ATIVAR MFA
          </button>
        </>
      )}

      {!enabled && setup.data && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            enable.mutate(code.trim());
          }}
        >
          <p className="text-muted-foreground">
            No app autenticador, adicione uma conta manualmente (tipo: baseado em tempo) com esta
            chave:
          </p>
          <p className="font-mono break-all select-all font-bold">{setup.data.secret}</p>
          <label
            htmlFor="mfa-enable-code"
            className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            CÓDIGO DE 6 DÍGITOS
          </label>
          <input
            id="mfa-enable-code"
            className={field}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            type="submit"
            className={btn}
            disabled={enable.isPending || code.trim().length < 6}
          >
            CONFIRMAR E ATIVAR
          </button>
        </form>
      )}

      {enabled && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            disable.mutate(code.trim());
          }}
        >
          <p className="font-bold uppercase text-xs">MFA ATIVO</p>
          <label
            htmlFor="mfa-disable-code"
            className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            CÓDIGO OU CÓDIGO DE RECUPERAÇÃO PARA DESATIVAR
          </label>
          <input
            id="mfa-disable-code"
            className={field}
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            type="submit"
            className={btn}
            disabled={disable.isPending || code.trim().length < 6}
          >
            DESATIVAR MFA
          </button>
        </form>
      )}
    </section>
  );
}
