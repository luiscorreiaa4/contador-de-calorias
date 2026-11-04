import React from 'react';
import { Link } from 'react-router';
import { DemoLoginButton } from '../../components/auth/DemoLoginButton';
import { ArrowRight, Beef, Clock, Flame, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { FAQ } from '../../seo/pages';

const STEPS = [
  {
    title: 'Conte sobre você',
    text: 'Peso, altura, idade, rotina e objetivo. O CalorieSync calcula sua TMB e seu TDEE e sugere calorias, proteínas, carboidratos e gorduras do dia.',
  },
  {
    title: 'Registre o que comeu',
    text: 'Busque alimentos brasileiros da Tabela TACO e lance café, almoço, jantar e lanches em gramas, em segundos.',
  },
  {
    title: 'Veja a evolução',
    text: 'Acompanhe as calorias da semana e do mês, o peso e as medidas, e saiba se está dentro da meta.',
  },
];

const MARQUEE = [
  'Metas automáticas',
  'Tabela TACO',
  'TMB & TDEE',
  'Macros do dia',
  'Histórico',
  'Grátis',
];

// Mock decorativo espelhando os cards reais do Diário (DiaryPage): valores fixos e coerentes entre si.
const MOCK_METRICS = [
  { label: 'Calorias', value: 1460, goal: '/2100', badge: 'flame' },
  { label: 'Proteínas', value: 96, goal: '/130g', badge: 'beef' },
  { label: 'Carboidratos', value: 170, goal: '/236g', badge: 'C' },
  { label: 'Gorduras', value: 41, goal: '/58g', badge: 'G' },
] as const;

const MOCK_GOALS: Record<string, number> = {
  Calorias: 2100,
  Proteínas: 130,
  Carboidratos: 236,
  Gorduras: 58,
};

// Almoço com valores da TACO: arroz 128, feijão 76, frango 159 kcal/100 g.
const MOCK_ITEMS = [
  { name: 'Arroz, tipo 1, cozido', qty: '150 g' },
  { name: 'Feijão, carioca, cozido', qty: '100 g' },
  { name: 'Frango, peito, grelhado', qty: '120 g' },
];

const DiaryMock: React.FC = () => (
  <div aria-hidden="true" className="relative mx-auto w-full max-w-md select-none">
    <div className="absolute -top-5 -left-3 z-20 -rotate-6 border-2 border-edge bg-primary text-primary-foreground shadow-hard-fill px-3 py-1.5 text-xs font-black uppercase tracking-wider">
      Seu dia em números
    </div>

    <div className="relative z-10 rotate-1 bg-background border-2 border-border shadow-hard p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {MOCK_METRICS.map(({ label, value, goal, badge }) => (
          <div key={label} className="bg-card border-2 border-border p-3 shadow-hard">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                {label}
              </span>
              {badge === 'flame' ? (
                <Flame className="w-4 h-4 text-primary-ink" />
              ) : badge === 'beef' ? (
                <Beef className="w-4 h-4 text-primary-ink" />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold text-primary-ink bg-secondary border-2 border-border">
                  {badge}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-heading font-black text-foreground tracking-tighter">
                {value}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">{goal}</span>
            </div>
            <div className="w-full bg-background border-2 border-border h-2 mt-2 overflow-hidden">
              <div
                className="bg-primary h-full"
                style={{ width: `${Math.round((value / MOCK_GOALS[label]) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border-2 border-border p-3">
        <div className="mb-3 border-b-2 border-border pb-3">
          <p className="font-heading font-black text-sm text-foreground uppercase tracking-tighter">
            Almoço
          </p>
          <p className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3" />
            12:30
          </p>
        </div>
        <div className="space-y-1.5 mb-3">
          {MOCK_ITEMS.map(({ name, qty }) => (
            <p
              key={name}
              className="text-[10px] font-bold text-foreground flex items-center justify-between"
            >
              <span className="truncate pr-3 uppercase">{name}</span>
              <span className="text-[9px] text-muted-foreground shrink-0 bg-background border-2 border-border px-1 py-0.5 tracking-wider">
                {qty}
              </span>
            </p>
          ))}
        </div>
        <div className="flex items-center gap-4 text-[10px] pt-2 border-t-2 border-border font-black text-foreground uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-primary-ink" />
            459 KCAL
          </span>
          <span className="flex items-center gap-1.5">
            <Beef className="w-3.5 h-3.5 text-primary-ink" />
            47G PROT
          </span>
        </div>
      </div>
    </div>

    <div className="absolute -bottom-5 -right-3 z-20 rotate-3 flex items-center gap-2 bg-primary text-primary-foreground border-2 border-edge shadow-hard-fill px-4 py-2 text-xs font-black uppercase tracking-widest">
      <Plus className="w-4 h-4" />
      Nova Refeição
    </div>
  </div>
);

const SectionTitle: React.FC<{ id: string; eyebrow: string; children: React.ReactNode }> = ({
  id,
  eyebrow,
  children,
}) => (
  <div className="space-y-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-ink">{eyebrow}</p>
    <h2
      id={id}
      className="text-3xl sm:text-5xl font-heading font-black text-foreground uppercase tracking-tighter leading-[0.95]"
    >
      {children}
    </h2>
  </div>
);

export const LandingPage: React.FC = () => (
  <div className="w-full space-y-20 sm:space-y-28">
    {/* Hero */}
    <section className="relative bg-grid">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid gap-16 lg:gap-10 lg:grid-cols-[1.15fr_1fr] items-center py-6 sm:py-10">
        <div className="space-y-7 text-center lg:text-left">
          <h1 className="text-5xl sm:text-7xl font-heading font-black text-foreground uppercase tracking-tighter leading-[0.9]">
            Saiba{' '}
            <span className="inline-block -rotate-1 bg-primary text-primary-foreground border-2 border-edge px-2 shadow-hard-fill">
              quanto comer
            </span>{' '}
            e registre o que comeu
          </h1>
          <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-muted-foreground leading-relaxed">
            O CalorieSync calcula sua meta diária de calorias e macronutrientes a partir do seu
            corpo e da sua rotina, e você registra as refeições com alimentos da tabela TACO.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Button asChild size="lg">
              <Link to="/cadastro">
                Criar conta grátis
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Entrar</Link>
            </Button>
            <DemoLoginButton size="lg" />
          </div>
        </div>
        <DiaryMock />
      </div>
    </section>

    {/* Faixa rolante */}
    <div
      aria-hidden="true"
      className="-rotate-1 border-y-2 border-edge bg-primary text-primary-foreground overflow-hidden py-3"
    >
      <div className="flex w-max animate-marquee">
        {[...MARQUEE, ...MARQUEE].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-6 px-6 text-lg sm:text-2xl font-heading font-black uppercase tracking-tighter whitespace-nowrap"
          >
            {item}
            <span className="text-base">✦</span>
          </span>
        ))}
      </div>
    </div>

    {/* Como funciona */}
    <section aria-labelledby="como-funciona" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
      <SectionTitle id="como-funciona" eyebrow="Em 3 passos">
        Como funciona
      </SectionTitle>
      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map(({ title, text }, i) => (
          <li
            key={title}
            className="group bg-card border-2 border-border shadow-hard transition-all hover:shadow-hard-hover hover:-translate-y-1 p-6 sm:p-8 space-y-4"
          >
            <span className="block text-6xl font-heading font-black tracking-tighter leading-none text-primary-ink">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="text-lg font-heading font-black uppercase tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
          </li>
        ))}
      </ol>
    </section>

    {/* FAQ */}
    <section
      aria-labelledby="perguntas-frequentes"
      className="max-w-6xl mx-auto px-4 sm:px-6 grid gap-10 lg:grid-cols-[1fr_1.6fr]"
    >
      <div className="lg:sticky lg:top-[calc(6rem+env(safe-area-inset-top))] self-start space-y-4">
        <SectionTitle id="perguntas-frequentes" eyebrow="Dúvidas">
          Perguntas frequentes
        </SectionTitle>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
          Tudo sobre como as metas são calculadas, de onde vêm os alimentos e como seus dados são
          tratados.
        </p>
      </div>
      <div className="border-2 border-border bg-card shadow-hard divide-y-2 divide-border">
        {FAQ.map(({ question, answer }) => (
          <details key={question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 text-sm font-heading font-black uppercase tracking-tight text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              {question}
              <Plus
                className="h-5 w-5 shrink-0 text-primary-ink transition-transform group-open:rotate-45"
                aria-hidden="true"
              />
            </summary>
            <p className="px-5 sm:px-6 pb-6 text-sm text-muted-foreground leading-relaxed">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>

    {/* CTA final */}
    <section className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="relative overflow-hidden border-2 border-edge bg-primary text-primary-foreground shadow-hard-fill px-6 py-12 sm:px-12 sm:py-16 text-center space-y-6">
        <h2 className="text-3xl sm:text-6xl font-heading font-black uppercase tracking-tighter leading-[0.95]">
          Sua meta pronta em poucos minutos
        </h2>
        <p className="max-w-lg mx-auto text-sm sm:text-base font-medium">
          Crie a conta, responda algumas perguntas e comece a registrar hoje mesmo.
        </p>
        <Link
          to="/cadastro"
          className="inline-flex h-14 items-center justify-center gap-2 border-2 border-edge bg-background text-foreground px-8 text-base font-bold uppercase tracking-wider shadow-hard-fill transition-all hover:-translate-y-0.5 hover:shadow-hard-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          Começar agora
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  </div>
);
