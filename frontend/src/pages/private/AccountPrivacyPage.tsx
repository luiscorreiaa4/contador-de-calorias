import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { deleteUserAccount, exportUserData } from '../../services/auth.service';
import { downloadJsonFile } from '../../utils/download';
import { DeleteAccountModal } from '../../components/common/DeleteAccountModal';

export function AccountPrivacyPage() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);
  const remove = useMutation({
    mutationFn: deleteUserAccount,
    onSuccess: () => { queryClient.clear(); logout(); },
  });
  const download = useMutation({
    mutationFn: exportUserData,
    onSuccess: payload => downloadJsonFile(payload, `caloriesync-dados-${payload.exported_at.slice(0, 10)}.json`),
  });
  return <section className="border-2 border-border bg-card p-6 shadow-hard space-y-6">
    <h2 className="font-heading font-black text-xl uppercase">PRIVACIDADE E DADOS</h2>
    <p className="text-muted-foreground">Baixe uma cópia dos seus dados ou solicite a exclusão da conta.</p>
    {download.isError && <p role="alert" className="text-destructive">{download.error.message}</p>}
    {download.isSuccess && <p role="status" className="font-bold uppercase">SEUS DADOS FORAM EXPORTADOS COM SUCESSO!</p>}
    <button type="button" disabled={download.isPending} onClick={() => download.mutate()} className="border-2 border-border px-4 py-3 font-black text-xs uppercase hover:bg-secondary disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary">{download.isPending ? 'EXPORTANDO...' : 'EXPORTAR MEUS DADOS'}</button>
    <div className="border-2 border-destructive p-4 space-y-3">
      <h3 className="font-black uppercase text-destructive">EXCLUIR CONTA</h3>
      <p className="text-muted-foreground">A exclusão é permanente. Você precisará confirmar sua senha.</p>
      <button type="button" onClick={() => setShowDelete(true)} className="border-2 border-destructive px-4 py-3 text-destructive text-xs font-black uppercase hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-destructive">EXCLUIR CONTA</button>
    </div>
    <DeleteAccountModal isOpen={showDelete} onClose={() => { setShowDelete(false); remove.reset(); }} onConfirm={async password => { await remove.mutateAsync(password).catch(() => {}); }} isLoading={remove.isPending} error={remove.error?.message || null} />
  </section>;
}
