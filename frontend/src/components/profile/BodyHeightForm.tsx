import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProfileQueryBoundary } from './ProfileQueryBoundary';
import { ProfileFormFeedback } from './ProfileFormFeedback';
import { useProfileUpdate } from '../../hooks/useProfileSettings';

const heightSchema = z.object({ height: z.number({ invalid_type_error: 'INFORME UMA ALTURA VÁLIDA.' }).positive('A ALTURA DEVE SER MAIOR QUE ZERO.') });

function HeightForm({ height }: { height: number | null }) {
  const mutation = useProfileUpdate();
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<z.infer<typeof heightSchema>>({
    resolver: zodResolver(heightSchema), defaultValues: { height: height ?? undefined },
  });
  return <form noValidate onSubmit={handleSubmit(data => mutation.mutate(data, { onSuccess: () => reset(data) }))} className="space-y-4">
    <p className="text-muted-foreground">Sua altura é usada no cálculo das metas automáticas. Peso e gordura são registrados em Nova medição.</p>
    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
      <div className="space-y-2">
        <label htmlFor="body-height" className="block text-xs font-black uppercase">ALTURA (CM)</label>
        <input id="body-height" type="number" step="any" min="1" {...register('height', { valueAsNumber: true })} aria-invalid={!!errors.height} className="border-2 border-border bg-background p-3 w-full focus:border-primary outline-none" />
        {errors.height && <p role="alert" className="text-destructive text-xs">{errors.height.message}</p>}
      </div>
      <button type="submit" disabled={!isDirty || mutation.isPending} className="border-2 border-border p-3 text-xs font-black uppercase hover:bg-secondary disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary">{mutation.isPending ? 'SALVANDO...' : 'SALVAR ALTURA'}</button>
    </div>
    <ProfileFormFeedback error={mutation.error} success={mutation.isSuccess} />
  </form>;
}

export function BodyHeightForm() {
  return <section className="border-2 border-border bg-card p-6 shadow-hard space-y-4">
    <h3 className="text-lg font-heading font-black uppercase">DADOS CORPORAIS</h3>
    <ProfileQueryBoundary>{user => <HeightForm height={user.height} />}</ProfileQueryBoundary>
  </section>;
}
