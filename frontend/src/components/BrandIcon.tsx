import type { SVGProps } from 'react';

export function BrandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m17 7-2.17 2.17" />
      <path d="m17 17-2.17-2.17" />
      <path d="m7 17 2.17-2.17" />
      <path d="m7 7 2.17 2.17" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
