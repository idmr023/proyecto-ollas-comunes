import { ReactNode } from 'react';

type PageShellWidth = 'wide' | 'form';

const widthClasses: Record<PageShellWidth, string> = {
  wide: 'max-w-5xl',
  form: 'max-w-3xl',
};

interface PageShellProps {
  title: string;
  description?: string;
  width?: PageShellWidth;
  children: ReactNode;
}

export function PageShell({
  title,
  description,
  width = 'wide',
  children,
}: PageShellProps) {
  return (
    <div className={`mx-auto flex w-full ${widthClasses[width]} flex-col gap-6`}>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-heading text-foreground">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
