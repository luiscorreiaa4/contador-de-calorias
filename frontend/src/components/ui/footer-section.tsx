"use client"

import React from "react"
import { Input } from "./input"
import { Label } from "./label"
import { Switch } from "./switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"
import { Moon, Send, Sun } from "lucide-react"

export interface FooterSectionProps {
  darkMode: boolean
  onToggleTheme: (checked: boolean) => void
}

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const TwitterXIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z"/>
  </svg>
)

function FooterSection({ darkMode, onToggleTheme }: FooterSectionProps) {
  return (
    <footer className="relative border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 mt-24 sm:mt-32 lg:mt-40">
      <div className="container mx-auto px-4 py-16 md:py-20 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">Fique Conectado</h2>
            <p className="mb-6 text-zinc-500 dark:text-zinc-400">
              Junte-se à nossa newsletter para as últimas atualizações e ofertas exclusivas.
            </p>
            <form className="relative" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Digite seu e-mail"
                className="pr-12 bg-zinc-50/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                aria-label="Inscrever-se"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Links Rápidos</h3>
            <nav className="space-y-2 text-sm">
              <a href="#" className="block transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                Início
              </a>
              <a href="#" className="block transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                Sobre Nós
              </a>
              <a href="#" className="block transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                Serviços
              </a>
              <a href="#" className="block transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                Produtos
              </a>
              <a href="#" className="block transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
                Contato
              </a>
            </nav>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Fale Conosco</h3>
            <address className="space-y-2 text-sm not-italic text-zinc-600 dark:text-zinc-400">
              <p>123 Rua da Inovação</p>
              <p>Cidade Tech, TC 12345</p>
              <p>Telefone: (11) 98765-4321</p>
              <p>E-mail: ola@exemplo.com</p>
            </address>
          </div>

          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold">Siga-nos</h3>
            <div className="mb-6 flex space-x-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="#"
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all shadow-sm border border-zinc-200/60 dark:border-zinc-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      aria-label="Facebook"
                    >
                      <FacebookIcon className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Facebook</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="#"
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all shadow-sm border border-zinc-200/60 dark:border-zinc-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      aria-label="X (Twitter)"
                    >
                      <TwitterXIcon className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>X (Twitter)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="#"
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all shadow-sm border border-zinc-200/60 dark:border-zinc-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      aria-label="Instagram"
                    >
                      <InstagramIcon className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Instagram</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="#"
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all shadow-sm border border-zinc-200/60 dark:border-zinc-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      aria-label="LinkedIn"
                    >
                      <LinkedInIcon className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>LinkedIn</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={onToggleTheme}
              />
              <Moon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <Label htmlFor="dark-mode" className="sr-only">
                Alternar modo escuro
              </Label>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-8 text-center md:flex-row">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} Contador de Calorias. Todos os direitos reservados.
          </p>
          <nav className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="#" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
              Política de Privacidade
            </a>
            <a href="#" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
              Termos de Serviço
            </a>
            <a href="#" className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400">
              Configurações de Cookies
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { FooterSection }
