import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full px-5 py-5 text-center z-10">
      <p className="text-xs text-zinc-400 dark:text-zinc-600">© {currentYear} Contador de Calorias</p>
    </footer>
  );
};
