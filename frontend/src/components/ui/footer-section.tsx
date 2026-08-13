"use client"

import { Flame, ShieldAlert, Heart, Smartphone } from "lucide-react"

export interface FooterSectionProps {
  darkMode?: boolean
  onToggleTheme?: (checked: boolean) => void
}

function FooterSection() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md text-zinc-800 dark:text-zinc-200 transition-colors duration-300 mt-10 sm:mt-16">
      {/* Subtle glowing ambient accent */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Top: Brand & App Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30 ring-1 ring-white/20 shrink-0">
              <Flame className="w-4 h-4 fill-current" aria-hidden="true" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                Contador de{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                  Calorias
                </span>
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Constância e clareza para suas metas nutricionais diárias.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs">
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span>v1.0 • Mobile & Web App</span>
            </span>
          </div>
        </div>

        {/* Middle: Health / Nutritional Disclaimer Card */}
        <div className="rounded-xl p-3.5 sm:p-4 bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <strong className="font-semibold text-zinc-700 dark:text-zinc-300">Aviso Nutricional:</strong> Os cálculos calóricos e de macronutrientes são estimativas informativas baseadas em tabelas de referência para suporte aos seus hábitos. Não substituem diagnósticos ou recomendações de médicos e nutricionistas.
          </p>
        </div>

        {/* Bottom: Legal Links & Copyright */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400">
          <p className="flex items-center gap-1">
            © {currentYear} Contador de Calorias. Feito com{' '}
            <Heart className="w-3 h-3 text-red-500 fill-current inline-block" aria-hidden="true" />{' '}
            para sua saúde.
          </p>

          <nav className="flex items-center gap-4 text-xs">
            <a
              href="#privacidade"
              onClick={(e) => e.preventDefault()}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Privacidade
            </a>
            <span className="text-zinc-300 dark:text-zinc-700" aria-hidden="true">•</span>
            <a
              href="#termos"
              onClick={(e) => e.preventDefault()}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Termos de Uso
            </a>
            <span className="text-zinc-300 dark:text-zinc-700" aria-hidden="true">•</span>
            <a
              href="#seguranca"
              onClick={(e) => e.preventDefault()}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Segurança
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { FooterSection }
