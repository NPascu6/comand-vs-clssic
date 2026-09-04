import { useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Paper, Typography } from '@mui/material';
import { ResizeHandle } from './ResizeHandle';
import type { ResizeHandleProps } from './ResizeHandle';

const MIN_WIDTH = 160;

// The handle only reports pointer-down; this demo owns the drag the way a panel would.
function Demo({ 'aria-label': ariaLabel, title }: Pick<ResizeHandleProps, 'aria-label' | 'title'>) {
  const [width, setWidth] = useState(320);

  function onPointerDown(event: ReactPointerEvent) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    const onMove = (pointerEvent: PointerEvent) => setWidth(Math.max(MIN_WIDTH, startWidth + pointerEvent.clientX - startX));
    const onUp = () => {
      globalThis.removeEventListener('pointermove', onMove);
      globalThis.removeEventListener('pointerup', onUp);
    };
    globalThis.addEventListener('pointermove', onMove);
    globalThis.addEventListener('pointerup', onUp);
  }

  return (
    <Paper variant="outlined" sx={{ position: 'relative', width, height: 160, p: 2 }}>
      <Typography variant="body2">Drag the right edge. Width: {width}px</Typography>
      <ResizeHandle onPointerDown={onPointerDown} aria-label={ariaLabel} title={title} />
    </Paper>
  );
}

const meta = {
  title: 'Layout/ResizeHandle',
  component: ResizeHandle,
  args: { 'aria-label': 'Drag to resize', title: 'Drag to resize', onPointerDown: () => undefined },
  render: (args) => <Demo aria-label={args['aria-label']} title={args.title} />,
} satisfies Meta<typeof ResizeHandle>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoTooltip: Story = {
  args: { title: undefined },
};
