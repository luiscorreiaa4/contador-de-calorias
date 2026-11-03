import React from 'react';
import { Link } from 'react-router';
import { Calculator, Database, LineChart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { FAQ } from '../../seo/pages';

const FEATURES = [
  {
    icon: Calculator,
    title: 'Metas calculadas para você',
    text: 'Informe peso, altura, idade, rotina e objetivo. O CalorieSync calcula sua TMB e seu TDEE e sugere calorias, proteínas, carboidratos e gorduras do dia.',
  },
  {
    icon: Database,
    title: 'Alimentos da tabela TACO',
    text: 'Busque alimentos brasileiros com valores da Tabela Brasileira de Composição de Alimentos e registre café, almoço, jantar e lanches em gramas.',
  },
  {
    icon: LineChart,
    title: 'Histórico e evolução',
    text: 'Acompanhe as calorias da semana e do mês, o peso e as medidas, e veja se está dentro da meta.',
  },
];

export const LandingPage: React.FC = () => (
  <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 space-y-16 sm:space-y-24">
    <section className="space-y-6 text-center sm:text-left">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-ink">
        Contador de calorias gratuito
      </p>
      <h1 className="text-4xl sm:text-6xl font-heading font-black text-foreground uppercase tracking-tighter">
        Saiba quanto comer e registre o que comeu
      </h1>
      <p className="max-w-2xl text-base text-muted-foreground leading-relaxed">
        O CalorieSync calcula sua meta diária de calorias e macronutrientes a partir do seu corpo e
        da sua rotina, e você registra as refeições com alimentos da tabela TACO.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
        <Button asChild>
          <Link to="/cadastro">Criar conta grátis</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/login">Entrar</Link>
        </Button>
      </div>
    </section>

    <section aria-labelledby="como-funciona" className="space-y-6">
      <h2
        id="como-funciona"
        className="text-2xl sm:text-3xl font-heading font-black text-foreground uppercase tracking-tighter"
      >
        Como funciona
      </h2>
      <ul className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="bg-card border-2 border-border shadow-hard p-6 space-y-3">
            <Icon className="w-6 h-6 text-primary-ink" aria-hidden="true" />
            <h3 className="text-sm font-heading font-black uppercase tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
          </li>
        ))}
      </ul>
    </section>

    <section aria-labelledby="perguntas-frequentes" className="space-y-6">
      <h2
        id="perguntas-frequentes"
        className="text-2xl sm:text-3xl font-heading font-black text-foreground uppercase tracking-tighter"
      >
        Perguntas frequentes
      </h2>
      <dl className="border-2 border-border bg-card divide-y-2 divide-border">
        {FAQ.map(({ question, answer }) => (
          <div key={question} className="p-6 space-y-2">
            <dt className="text-sm font-heading font-black uppercase tracking-tight text-foreground">
              {question}
            </dt>
            <dd className="text-sm text-muted-foreground leading-relaxed">{answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  </div>
);
