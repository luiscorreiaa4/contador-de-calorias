import type { ReactNode } from 'react';
import { useProfileQuery } from '../../hooks/useProfileSettings';
import type { UserProfile } from '../../services/auth.service';

export function ProfileQueryBoundary({ children }: { children: (user: UserProfile) => ReactNode }) {
  const query = useProfileQuery();
  if (query.isPending) return <p role="status" className="font-bold uppercase">CARREGANDO PERFIL...</p>;
  if (query.isError) return (
    <div role="alert" className="border-2 border-destructive p-4 text-destructive space-y-3">
      <p>{query.error.message}</p>
      <button type="button" className="border-2 border-border p-3 font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" onClick={() => void query.refetch()}>TENTAR NOVAMENTE</button>
    </div>
  );
  if (!query.data) return <p className="font-bold uppercase">PERFIL NÃO ENCONTRADO.</p>;
  return children(query.data);
}
