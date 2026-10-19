import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registerPushNotifications, sendTestPush } from '../../services/push.service';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const enable = useMutation({
    mutationFn: registerPushNotifications,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['pushSubscription'] }); },
  });
  const test = useMutation({ mutationFn: sendTestPush });
  return <section className="bg-card border-2 border-border shadow-hard p-6 space-y-6">
    <h2 className="font-heading font-black text-xl uppercase">NOTIFICAÇÕES</h2>
    <p className="text-muted-foreground">Ative lembretes de refeições neste navegador e envie um lembrete de teste.</p>
    {(enable.error || test.error) && <p role="alert" className="text-destructive font-bold">{(enable.error || test.error)?.message}</p>}
    {enable.isSuccess && <p role="status" className="font-bold uppercase">NOTIFICAÇÕES PUSH ATIVADAS COM SUCESSO!</p>}
    {test.isSuccess && <p role="status" className="font-bold uppercase">LEMBRETE DE TESTE ENVIADO COM SUCESSO!</p>}
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => enable.mutate()} disabled={enable.isPending} className="border-2 border-primary bg-primary text-primary-foreground px-4 py-3 text-xs font-black uppercase disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-foreground">{enable.isPending ? 'ATIVANDO...' : 'ATIVAR NOTIFICAÇÕES PUSH'}</button>
      <button type="button" onClick={() => test.mutate()} disabled={test.isPending} className="border-2 border-border px-4 py-3 text-xs font-black uppercase hover:bg-secondary disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary">{test.isPending ? 'ENVIANDO...' : 'ENVIAR LEMBRETE DE TESTE'}</button>
    </div>
  </section>;
}
