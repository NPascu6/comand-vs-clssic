import { CircularProgress, Stack, Typography } from '@mui/material';

export interface LoadingProps {
  label?: string;
  /** Small spinner that sits in a line of text. Default false (a centred block). */
  inline?: boolean;
}

export function Loading({ label, inline = false }: LoadingProps) {
  const text = label ? (
    <Typography component="span" variant="body2" color="text.secondary">
      {label}
    </Typography>
  ) : null;

  if (inline) {
    return (
      <Stack component="span" direction="row" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} aria-label={label ?? 'Loading'} />
        {text}
      </Stack>
    );
  }
  return (
    <Stack sx={{ alignItems: 'center', justifyContent: 'center', gap: 1.5, p: 4 }}>
      <CircularProgress size={28} aria-label={label ?? 'Loading'} />
      {text}
    </Stack>
  );
}
