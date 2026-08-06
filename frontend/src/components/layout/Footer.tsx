import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full max-w-7xl mx-auto px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400 z-10 border-t border-slate-200/50 dark:border-slate-800/60">
      <p>© {currentYear} Contador de Calorias. Todos os direitos reservados.</p>
    </footer>
  );
};
