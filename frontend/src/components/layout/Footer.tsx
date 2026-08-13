import React from 'react';
import { FooterSection } from '../ui/footer-section';

export interface FooterProps {
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const Footer: React.FC<FooterProps> = ({ darkMode, onToggleTheme }) => {
  return <FooterSection darkMode={darkMode} onToggleTheme={onToggleTheme} />;
};

