export function NotificationsPage() {
  return (
    <section className="bg-card border-2 border-border shadow-hard p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading font-black text-xl uppercase tracking-tighter">NOTIFICAÇÕES</h2>
        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
          Gerencie os canais de lembrete de refeição e alertas automáticos da sua conta.
        </p>
      </div>

      <div className="space-y-3">
        {/* Notificações Push no Navegador (Temporariamente Desabilitado) */}
        <div className="border-2 border-border bg-background p-4 opacity-80">
          <label
            htmlFor="push-notifications-toggle"
            className="flex items-start gap-3.5 cursor-not-allowed select-none"
          >
            <div className="relative flex items-center justify-center shrink-0 mt-0.5">
              <input
                type="checkbox"
                id="push-notifications-toggle"
                checked={false}
                disabled
                className="sr-only peer"
                aria-label="Ativar lembretes de refeições via notificação push (temporariamente desabilitado)"
              />
              <div className="w-5 h-5 rounded-none border-2 border-border bg-card/60 opacity-60 flex items-center justify-center cursor-not-allowed" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  NOTIFICAÇÕES PUSH (NAVEGADOR)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-secondary text-muted-foreground border-2 border-border">
                  TEMPORARIAMENTE DESABILITADO
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium block">
                Receba avisos sonoros e visuais no navegador nos horários de café, almoço e jantar
                para manter seu diário sempre em dia.
              </span>
            </div>
          </label>
        </div>

        {/* Notificações por E-mail (Em Implementação) */}
        <div className="border-2 border-border bg-background p-4 opacity-80">
          <label
            htmlFor="email-notifications-toggle"
            className="flex items-start gap-3.5 cursor-not-allowed select-none"
          >
            <div className="relative flex items-center justify-center shrink-0 mt-0.5">
              <input
                type="checkbox"
                id="email-notifications-toggle"
                checked={false}
                disabled
                className="sr-only peer"
                aria-label="Ativar notificações por e-mail (em implementação)"
              />
              <div className="w-5 h-5 rounded-none border-2 border-border bg-card/60 opacity-60 flex items-center justify-center cursor-not-allowed" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  NOTIFICAÇÕES POR E-MAIL
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-secondary text-muted-foreground border-2 border-border">
                  EM IMPLEMENTAÇÃO
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium block">
                Resumos diários, relatórios de consumo calórico e avisos de refeições pendentes
                enviados diretamente para sua caixa de entrada.
              </span>
            </div>
          </label>
        </div>

        {/* Notificações no Telefone (Em Implementação) */}
        <div className="border-2 border-border bg-background p-4 opacity-80">
          <label
            htmlFor="phone-notifications-toggle"
            className="flex items-start gap-3.5 cursor-not-allowed select-none"
          >
            <div className="relative flex items-center justify-center shrink-0 mt-0.5">
              <input
                type="checkbox"
                id="phone-notifications-toggle"
                checked={false}
                disabled
                className="sr-only peer"
                aria-label="Ativar notificações no telefone via SMS ou WhatsApp (em implementação)"
              />
              <div className="w-5 h-5 rounded-none border-2 border-border bg-card/60 opacity-60 flex items-center justify-center cursor-not-allowed" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  NOTIFICAÇÕES NO TELEFONE (SMS / WHATSAPP)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-secondary text-muted-foreground border-2 border-border">
                  EM IMPLEMENTAÇÃO
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium block">
                Lembretes instantâneos no seu celular por SMS ou WhatsApp para registrar café da
                manhã, almoço, lanche e jantar.
              </span>
            </div>
          </label>
        </div>
      </div>
    </section>
  );
}
