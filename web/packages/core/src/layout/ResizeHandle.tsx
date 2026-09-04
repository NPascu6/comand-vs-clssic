import type { PointerEvent as ReactPointerEvent } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

export interface ResizeHandleProps {
  /** Receives the pointer-down; the drag maths (move / up listeners) belongs to the caller. */
  onPointerDown: (event: ReactPointerEvent) => void;
  'aria-label': string;
  title?: string;
}

/** A thin drag affordance pinned to the right edge of a `position: relative` parent; its only visual is the hover tint. */
export function ResizeHandle({ onPointerDown, 'aria-label': ariaLabel, title }: ResizeHandleProps) {
  return (
    <Box
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      title={title}
      onPointerDown={onPointerDown}
      sx={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 6,
        cursor: 'col-resize',
        touchAction: 'none',
        '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2) },
      }}
    />
  );
}
