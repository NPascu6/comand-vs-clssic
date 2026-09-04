import type { ReactNode } from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';

export interface BreadcrumbItem {
  label: ReactNode;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/** The last item is plain text; earlier ones are Link buttons when they have an onClick. */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const last = items.length - 1;
  return (
    <MuiBreadcrumbs aria-label="Breadcrumb">
      {items.map((item, index) =>
        index === last || !item.onClick ? (
          <Typography key={index} variant="body2" color={index === last ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: index === last ? 600 : undefined }}>
            {item.label}
          </Typography>
        ) : (
          <Link key={index} component="button" type="button" variant="body2" color="inherit" onClick={item.onClick}>
            {item.label}
          </Link>
        ),
      )}
    </MuiBreadcrumbs>
  );
}
