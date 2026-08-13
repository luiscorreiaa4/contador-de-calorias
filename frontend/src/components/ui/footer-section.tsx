"use client"

import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { Switch } from "./switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"
import { Camera, Link, MessageCircle, Moon, Send, Share2, Sun } from "lucide-react"

export interface FooterSectionProps {
  darkMode: boolean
  onToggleTheme: (checked: boolean) => void
}

function FooterSection({ darkMode, onToggleTheme }: FooterSectionProps) {
  return (
    <footer className="relative border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 mt-auto">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
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
                className="pr-12 backdrop-blur-sm"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 rounded-full transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Inscrever-se</span>
              </Button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Links Rápidos</h3>
            <nav className="space-y-2 text-sm">
              <a href="#" className="block transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                Início
              </a>
              <a href="#" className="block transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                Sobre Nós
              </a>
              <a href="#" className="block transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                Serviços
              </a>
              <a href="#" className="block transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
                Produtos
              </a>
              <a href="#" className="block transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
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
            <div className="mb-6 flex space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Share2 className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Siga-nos no Facebook</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <MessageCircle className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Siga-nos no Twitter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Camera className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Siga-nos no Instagram</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Link className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Conecte-se conosco no LinkedIn</p>
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
            <a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
              Política de Privacidade
            </a>
            <a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
              Termos de Serviço
            </a>
            <a href="#" className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
              Configurações de Cookies
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { FooterSection }
