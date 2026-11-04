/** Altura mínima da tela útil no app mobile: nenhum estado de carregamento encolha a página. */
export const APP_MIN_H = 'min-h-[calc(100dvh-8rem)] md:min-h-0';

export function RouteLoading({ tall = true }: { tall?: boolean }) {
  return (
    <div
      data-route-loading
      className={`flex items-center justify-center w-full ${tall ? APP_MIN_H : 'h-64'}`}
    >
      <p
        role="status"
        className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
      >
        CARREGANDO...
      </p>
    </div>
  );
}
