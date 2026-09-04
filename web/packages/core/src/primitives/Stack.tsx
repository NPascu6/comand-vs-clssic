import { Stack as MuiStack } from '@mui/material';
import type { StackProps as MuiStackProps } from '@mui/material';
import type { Space } from './space';

export type StackAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';

export const STACK_ALIGNMENTS: readonly StackAlign[] = ['start', 'center', 'end', 'baseline', 'stretch'];
export const STACK_JUSTIFICATIONS: readonly StackJustify[] = ['start', 'center', 'end', 'between', 'around'];

const FLEX: Readonly<Record<StackAlign | StackJustify, string>> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  baseline: 'baseline',
  stretch: 'stretch',
  between: 'space-between',
  around: 'space-around',
};

export interface StackProps extends Omit<MuiStackProps, 'spacing' | 'direction' | 'alignItems' | 'justifyContent'> {
  direction?: 'column' | 'row';
  /** From the space scale, never a number: the rhythm is the designer's. */
  gap?: Space;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
  /** Take the space the parent offers. */
  grow?: boolean;
}

/** MUI's Stack with its gap on the space scale. */
export function Stack({ direction = 'column', gap = 'md', align, justify, wrap, grow, sx, ...rest }: StackProps) {
  return (
    <MuiStack
      direction={direction}
      useFlexGap
      sx={[
        {
          gap: `var(--atlas-space-${gap})`,
          minWidth: 0,
          alignItems: align && FLEX[align],
          justifyContent: justify && FLEX[justify],
          flexWrap: wrap ? 'wrap' : undefined,
          flex: grow ? 1 : undefined,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    />
  );
}
