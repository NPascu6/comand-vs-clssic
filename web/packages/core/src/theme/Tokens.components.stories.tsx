import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Stack, Typography } from '@mui/material';
import { themeInputs } from '@atlas/design-tokens';

const meta = {
  title: 'Theme/Tokens/Components',
  parameters: { controls: { disable: true } },
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

const { font, space } = themeInputs;

// A docs table column, off the space scale like everything else.
const propertyColumnWidth = themeInputs.space.xl * 5;

function entriesOf(group: object): ReadonlyArray<readonly [string, unknown]> {
  return Object.entries(group);
}

function isGroup(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function MonoText({ children }: { children: ReactNode }) {
  return (
    <Typography variant="caption" sx={{ fontFamily: font.mono, overflowWrap: 'anywhere' }}>
      {children}
    </Typography>
  );
}

function ComponentGroup({ name, tokens }: { name: string; tokens: object }) {
  return (
    <Stack sx={{ gap: `${space.sm}px` }}>
      <Typography variant="overline">component.{name}</Typography>
      {entriesOf(tokens).map(([property, value]) => (
        <Stack key={property} direction="row" sx={{ gap: `${space.md}px`, alignItems: 'baseline' }}>
          <Typography variant="body2" sx={{ width: propertyColumnWidth, flexShrink: 0 }}>
            {property}
          </Typography>
          <MonoText>{String(value)}</MonoText>
        </Stack>
      ))}
    </Stack>
  );
}

export const ComponentTokens: Story = {
  render: () => (
    <Stack sx={{ gap: `${space.xl}px` }}>
      {entriesOf(themeInputs.components).map(([name, tokens]) =>
        isGroup(tokens) ? <ComponentGroup key={name} name={name} tokens={tokens} /> : null,
      )}
    </Stack>
  ),
};
