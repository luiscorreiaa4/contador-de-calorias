export function ProfileFormFeedback({ error, success }: { error: Error | null; success: boolean }) {
  return <>
    {error && <p role="alert" className="border-2 border-destructive p-4 text-destructive font-bold">{error.message}</p>}
    {success && <p role="status" className="border-2 border-foreground p-4 font-bold uppercase">ALTERAÇÕES SALVAS COM SUCESSO!</p>}
  </>;
}

export function ProfileSaveButton({ pending, disabled, className = '' }: { pending: boolean; disabled?: boolean; className?: string }) {
  return <button type="submit" disabled={pending || disabled} className={`border-2 border-edge bg-primary text-primary-foreground px-6 py-3 font-black text-xs uppercase tracking-widest disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-hard-fill disabled:shadow-none ${className}`}>
    {pending ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
  </button>;
}
