import type { ComponentType, SVGProps } from 'react';

export type NavIconProps = { className?: string };
export type NavIcon = ComponentType<NavIconProps>;

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
  'aria-hidden': true,
  focusable: false,
};

const outline: SVGProps<SVGSVGElement> = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinejoin: 'miter',
  strokeLinecap: 'butt',
};

// Caderno: contorno com linhas / sólido com linhas vazadas.
export const DiaryIcon = ({ className }: NavIconProps) => (
  <svg {...base} {...outline} className={className}>
    <path d="M5 3h14v18H5z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
);

export const DiaryIconFilled = ({ className }: NavIconProps) => (
  <svg {...base} fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5 3h14v18H5V3zm4 4v2h6V7H9zm0 4v2h6v-2H9zm0 4v2h3v-2H9z" />
  </svg>
);

// Barras de progresso.
export const ProgressIcon = ({ className }: NavIconProps) => (
  <svg {...base} {...outline} className={className}>
    <path d="M4 20V10h4v10H4zM10 20V4h4v16h-4zM16 20v-7h4v7h-4z" />
  </svg>
);

export const ProgressIconFilled = ({ className }: NavIconProps) => (
  <svg {...base} fill="currentColor" className={className}>
    <path d="M4 20V10h4v10H4zM10 20V4h4v16h-4zM16 20v-7h4v7h-4z" />
  </svg>
);

// Avatar: cabeça e ombros.
export const AccountIcon = ({ className }: NavIconProps) => (
  <svg {...base} {...outline} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </svg>
);

export const AccountIconFilled = ({ className }: NavIconProps) => (
  <svg {...base} fill="currentColor" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7H4z" />
  </svg>
);
