import React from 'react';
import { Link } from 'react-router';
import { ArrowLeft, FileText, ShieldCheck, Lock } from 'lucide-react';

interface LegalSectionProps {
  title: string;
  children: React.ReactNode;
}

const LegalSection: React.FC<LegalSectionProps> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-sm font-heading font-black uppercase tracking-tight text-foreground">
      {title}
    </h2>
    <div className="space-y-3">{children}</div>
  </section>
);

interface LegalPageLayoutProps {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  icon,
  eyebrow,
  title,
  updatedAt,
  children,
}) => (
  <article className="w-full max-w-3xl mx-auto px-4 py-10 sm:py-14">
    <div className="border-b-2 border-border pb-6 mb-8 flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-ink mb-2 flex items-center gap-2">
          {icon}
          {eyebrow}
        </p>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-foreground uppercase tracking-tighter">
          {title}
        </h1>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Última atualização: {updatedAt}
        </p>
      </div>
      <Link
        to="/"
        className="shrink-0 flex items-center justify-center gap-2 px-3 py-2 border-2 border-border bg-background text-foreground text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Voltar
      </Link>
    </div>

    <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">{children}</div>

    <div className="mt-10 pt-6 border-t-2 border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      <p>
        Dúvidas sobre este documento? Fale com o encarregado de dados em{' '}
        <span className="text-foreground">privacidade@caloriesync.app</span>.
      </p>
    </div>
  </article>
);

export const TermsPage: React.FC = () => (
  <LegalPageLayout
    icon={<FileText className="w-3 h-3" aria-hidden="true" />}
    eyebrow="Documento Legal"
    title="Termos de Uso"
    updatedAt="19/10/2026"
  >
    <LegalSection title="1. Aceitação dos Termos">
      <p>
        Ao criar uma conta no CalorieSync você declara ter lido e concordado com estes Termos de Uso e
        com a nossa Política de Privacidade. O aceite é registrado com data e hora no momento do cadastro.
      </p>
    </LegalSection>

    <LegalSection title="2. Descrição do Serviço">
      <p>
        O CalorieSync é uma ferramenta de acompanhamento nutricional que estima calorias e macronutrientes
        a partir dos alimentos registrados e das metas definidas por você. As estimativas são aproximadas e
        dependem dos dados informados.
      </p>
    </LegalSection>

    <LegalSection title="3. Responsabilidades do Usuário">
      <p>
        Você é responsável pela veracidade das informações cadastradas, pela guarda da sua senha e pelo uso
        adequado da plataforma. É proibido tentar acessar dados de outras pessoas ou comprometer a segurança
        do serviço.
      </p>
    </LegalSection>

    <LegalSection title="4. Aviso de Saúde">
      <p>
        As estimativas nutricionais apresentadas não substituem orientação médica ou de nutricionista. Consulte
        um profissional de saúde antes de adotar dietas restritivas.
      </p>
    </LegalSection>

    <LegalSection title="5. Propriedade Intelectual">
      <p>
        A marca, o layout e o código do CalorieSync pertencem aos seus titulares. Os dados que você registra
        permanecem seus e podem ser exportados ou excluídos a qualquer momento.
      </p>
    </LegalSection>

    <LegalSection title="6. Alterações e Contato">
      <p>
        Podemos atualizar estes termos para refletir melhorias do serviço, sempre publicando a nova versão
        nesta página. O uso contínuo após a atualização implica concordância.
      </p>
    </LegalSection>
  </LegalPageLayout>
);

export const PrivacyPage: React.FC = () => (
  <LegalPageLayout
    icon={<ShieldCheck className="w-3 h-3" aria-hidden="true" />}
    eyebrow="Documento Legal"
    title="Política de Privacidade"
    updatedAt="19/10/2026"
  >
    <LegalSection title="1. Dados que Coletamos">
      <p>
        Dados de cadastro (nome e e-mail), dados do perfil (sexo, data de nascimento, peso, altura, percentual
        de gordura, nível de atividade e objetivo) e os registros de refeições, metas e medições corporais que
        você cria na plataforma.
      </p>
    </LegalSection>

    <LegalSection title="2. Finalidade e Base Legal">
      <p>
        Tratamos esses dados para operar o serviço e calcular suas metas nutricionais. A base legal é a execução
        do contrato e o consentimento que você concede no cadastro (LGPD, art. 7º).
      </p>
    </LegalSection>

    <LegalSection title="3. Compartilhamento">
      <p>
        Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins de publicidade. Dados podem
        ser tratados por provedores de infraestrutura estritamente para hospedar o serviço.
      </p>
    </LegalSection>

    <LegalSection title="4. Retenção">
      <p>
        Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir a conta, todos os registros associados
        são removidos de forma permanente.
      </p>
    </LegalSection>

    <LegalSection title="5. Seus Direitos (LGPD, art. 18)">
      <p>
        Você pode acessar, corrigir, exportar e excluir seus dados diretamente na página de perfil. A exportação
        gera um arquivo JSON com o histórico completo, e a exclusão elimina sua conta e todos os dados vinculados.
      </p>
    </LegalSection>

    <LegalSection title="6. Segurança">
      <p>
        Senhas são armazenadas com hash bcrypt e nunca em texto puro. O acesso é protegido por autenticação JWT
        e limite de tentativas. Detalhes adicionais estão na página de Segurança.
      </p>
    </LegalSection>
  </LegalPageLayout>
);

export const SecurityPage: React.FC = () => (
  <LegalPageLayout
    icon={<Lock className="w-3 h-3" aria-hidden="true" />}
    eyebrow="Documento Legal"
    title="Segurança"
    updatedAt="19/10/2026"
  >
    <LegalSection title="1. Proteção de Credenciais">
      <p>
        As senhas são processadas com bcrypt e nunca são armazenadas ou trafegadas em texto puro. Recomendamos
        senhas longas e únicas para sua conta.
      </p>
    </LegalSection>

    <LegalSection title="2. Sessões e Autenticação">
      <p>
        O acesso é autenticado por token JWT de expiração limitada. Em caso de troca de senha, a sessão anterior
        é invalidada.
      </p>
    </LegalSection>

    <LegalSection title="3. Mitigações de Ataque">
      <p>
        Aplicamos limite de tentativas de autenticação por IP e por e-mail, cabeçalhos de segurança HTTP e
        validação rigorosa de todos os dados de entrada.
      </p>
    </LegalSection>

    <LegalSection title="4. Reportar Vulnerabilidades">
      <p>
        Se você identificar uma falha de segurança, entre em contato pelo e-mail de privacidade antes de tornar
        o problema público. Investigaremos e responderemos o quanto antes.
      </p>
    </LegalSection>
  </LegalPageLayout>
);
