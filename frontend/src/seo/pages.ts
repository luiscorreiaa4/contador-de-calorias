// Metadados das páginas públicas pré-renderizadas no build (scripts/prerender.mjs).
export const SITE_URL = 'https://caloriesync-luiscorreia.netlify.app';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface FaqItem {
  question: string;
  answer: string;
}

// A primeira frase de cada resposta já responde a pergunta (bom para buscadores e IAs).
export const FAQ: FaqItem[] = [
  {
    question: 'O CalorieSync é gratuito?',
    answer:
      'Sim, o CalorieSync é gratuito. Basta criar uma conta com e-mail e senha e confirmar o e-mail para começar a registrar refeições.',
  },
  {
    question: 'Como o CalorieSync calcula minha meta de calorias?',
    answer:
      'A meta parte da sua Taxa Metabólica Basal (TMB) multiplicada pelo seu nível de atividade, o que dá o gasto energético diário (TDEE). A TMB usa a fórmula de Mifflin-St Jeor ou, se você informar o percentual de gordura, a de Katch-McArdle. Depois aplicamos o objetivo: 20% a menos para perder peso, 15% a mais para ganhar massa ou o próprio TDEE para manter.',
  },
  {
    question: 'De onde vêm os dados nutricionais dos alimentos?',
    answer:
      'Os alimentos vêm da Tabela Brasileira de Composição de Alimentos (TACO), da Unicamp. O catálogo é revisado por administradores, que corrigem nomes e valores sem apagar o histórico.',
  },
  {
    question: 'O CalorieSync divide proteínas, carboidratos e gorduras?',
    answer:
      'Sim, a meta diária já vem dividida em macronutrientes. A proteína parte de 1,6 g por kg de massa de referência, a gordura fica em 25% das calorias e o carboidrato completa o restante. Você pode ajustar as metas manualmente quando quiser.',
  },
  {
    question: 'Existe um limite mínimo de calorias?',
    answer:
      'Sim, a meta sugerida nunca fica abaixo de 1.500 kcal para homens e 1.200 kcal para mulheres. O piso evita dietas restritivas demais.',
  },
  {
    question: 'O CalorieSync substitui um nutricionista?',
    answer:
      'Não. As metas são estimativas para ajudar no dia a dia e não substituem orientação de um nutricionista ou médico, principalmente antes de dietas restritivas.',
  },
  {
    question: 'Meus dados de saúde ficam protegidos?',
    answer:
      'Sim. Peso, medidas e metas ficam só no servidor, a sessão usa cookie protegido e você pode exportar ou excluir sua conta quando quiser, como prevê a LGPD.',
  },
];

interface PageMeta {
  path: string;
  title: string;
  description: string;
}

export const PUBLIC_PAGES: PageMeta[] = [
  {
    path: '/',
    title: 'CalorieSync — Contador de calorias gratuito com metas automáticas',
    description:
      'Registre refeições com alimentos da tabela TACO e receba metas diárias de calorias e macros calculadas pela sua TMB e TDEE. Gratuito, em português.',
  },
  {
    path: '/termos',
    title: 'Termos de Uso — CalorieSync',
    description:
      'Termos de uso do CalorieSync: regras da conta, responsabilidades, aviso de saúde e como entrar em contato.',
  },
  {
    path: '/privacidade',
    title: 'Política de Privacidade — CalorieSync',
    description:
      'Como o CalorieSync trata seus dados de saúde segundo a LGPD: quais dados coleta, por quê, por quanto tempo e como excluí-los.',
  },
  {
    path: '/seguranca',
    title: 'Segurança — CalorieSync',
    description:
      'Como o CalorieSync protege sua conta: senhas com hash, confirmação por e-mail, sessão em cookie protegido e verificação em duas etapas.',
  },
];

const SOFTWARE_APPLICATION = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'CalorieSync',
  url: SITE_URL,
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  inLanguage: 'pt-BR',
  description: PUBLIC_PAGES[0].description,
  image: OG_IMAGE,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
};

const FAQ_PAGE = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
};

/** FAQPage só onde as perguntas aparecem na página (regra do Google para rich results). */
export function jsonLdFor(path: string): object[] {
  return path === '/' ? [SOFTWARE_APPLICATION, FAQ_PAGE] : [SOFTWARE_APPLICATION];
}
