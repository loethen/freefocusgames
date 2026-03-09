import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  homeLabel: string;
  locale: string;
}

export function Breadcrumb({ items, homeLabel, locale }: BreadcrumbProps) {
  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        <li>
          <Link href={`/${locale}`} prefetch={false} className="flex items-center hover:text-foreground">
            <Home className="h-4 w-4 mr-1" />
            <span>{homeLabel}</span>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {item.href ? (
              <Link href={item.href} prefetch={false} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 
