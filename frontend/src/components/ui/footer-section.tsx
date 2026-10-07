"use client"

import { Flame, ShieldAlert, Heart } from "lucide-react"

export interface FooterSectionProps {
  darkMode?: boolean
  onToggleTheme?: (checked: boolean) => void
}

function FooterSection() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative border-t-2 border-border bg-background text-foreground transition-colors duration-300 mt-10 sm:mt-16">
      {/* Neon accent top line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Top: Brand & App Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center shadow-hard shrink-0">
              <Flame className="w-6 h-6 fill-current" aria-hidden="true" />
            </div>
            <div>
              <span className="font-heading font-black text-lg sm:text-xl tracking-tighter text-foreground uppercase">
                CALORIE<span className="text-primary">SYNC</span>
              </span>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Constância e clareza para metas diárias.
              </p>
            </div>
          </div>

          {/* Badge removed as requested */}
        </div>

        {/* Middle: Simplified Health Disclaimer */}
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
          <ShieldAlert className="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
          <p>
            ESTIMATIVAS NUTRICIONAIS. NÃO SUBSTITUI ORIENTAÇÃO MÉDICA.
          </p>
        </div>

        {/* Bottom: Legal Links & Copyright */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <p className="flex items-center gap-1.5">
            © {currentYear} CalorieSync. Alta Performance{' '}
            <Heart className="w-3 h-3 text-primary fill-current inline-block" aria-hidden="true" />{' '}
          </p>

          <nav className="flex items-center gap-4">
            <a
              href="#privacidade"
              onClick={(e) => e.preventDefault()}
              className="hover:text-primary transition-colors focus:outline-none focus:text-primary"
            >
              Privacidade
            </a>
            <span className="text-border" aria-hidden="true">/</span>
            <a
              href="#termos"
              onClick={(e) => e.preventDefault()}
              className="hover:text-primary transition-colors focus:outline-none focus:text-primary"
            >
              Termos de Uso
            </a>
            <span className="text-border" aria-hidden="true">/</span>
            <a
              href="#seguranca"
              onClick={(e) => e.preventDefault()}
              className="hover:text-primary transition-colors focus:outline-none focus:text-primary"
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
