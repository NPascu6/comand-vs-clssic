import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Stack, Typography } from '@mui/material';
import { themeInputs } from '@atlas/design-tokens';

const meta = {
  title: 'Theme/Tokens/Global',
  parameters: { controls: { disable: true } },
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

const { font, radius, space, typography } = themeInputs;
const { button } = themeInputs.components;

// A docs table column, off the space scale like everything else.
const swatchColumnWidth = themeInputs.space.xl * 5;

const TYPE_RAMP = [
  ['title', 'h5'],
  ['heading', 'h6'],
  ['subheading', 'subtitle2'],
  ['body', 'body1'],
  ['bodySmall', 'body2'],
  ['caption', 'caption'],
  ['overline', 'overline'],
] as const;

function MonoText({ children }: { children: ReactNode }) {
  return (
    <Typography variant="caption" sx={{ fontFamily: font.mono, overflowWrap: 'anywhere' }}>
      {children}
    </Typography>
  );
}

function Scale({ title, values }: { title: string; values: Readonly<Record<string, number>> }) {
  return (
    <Stack sx={{ gap: `${space.sm}px` }}>
      <Typography variant="overline">{title}</Typography>
      {Object.entries(values).map(([name, value]) => (
        <Stack key={name} direction="row" sx={{ gap: `${space.md}px`, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ width: swatchColumnWidth, flexShrink: 0 }}>
            {name}
          </Typography>
          <Box sx={{ width: value, height: space.sm, borderRadius: `${radius.control}px`, bgcolor: 'primary.main' }} />
          <MonoText>{value}px</MonoText>
        </Stack>
      ))}
    </Stack>
  );
}

function RadiusSample() {
  return (
    <Stack sx={{ gap: `${space.sm}px` }}>
      <Typography variant="overline">radius</Typography>
      <Stack direction="row" sx={{ gap: `${space.lg}px` }}>
        {(['control', 'surface'] as const).map((name) => (
          <Stack key={name} sx={{ gap: `${space.xs}px` }}>
            <Box
              sx={{
                width: swatchColumnWidth,
                height: button.heightMd,
                borderRadius: `${radius[name]}px`,
                bgcolor: 'primary.main',
              }}
            />
            <Typography variant="caption">{name}</Typography>
            <MonoText>{radius[name]}px</MonoText>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

export const Shape: Story = {
  render: () => (
    <Stack sx={{ gap: `${space.xl}px` }}>
      <RadiusSample />
      <Scale title="space" values={space} />
    </Stack>
  ),
};

export const TypeRamp: Story = {
  render: () => (
    <Stack sx={{ gap: `${space.xl}px` }}>
      <Stack sx={{ gap: `${space.sm}px` }}>
        <Typography variant="overline">font</Typography>
        <MonoText>sans — {font.sans}</MonoText>
        <MonoText>mono — {font.mono}</MonoText>
      </Stack>
      <Stack sx={{ gap: `${space.md}px` }}>
        <Typography variant="overline">type ramp</Typography>
        {TYPE_RAMP.map(([name, muiVariant]) => (
          <Stack key={name} direction="row" sx={{ gap: `${space.md}px`, alignItems: 'baseline' }}>
            <MonoText>
              {name} → {muiVariant}
            </MonoText>
            <Typography variant={muiVariant}>Fund I committed EUR 25M across 12 assets</Typography>
          </Stack>
        ))}
      </Stack>
      <Stack sx={{ gap: `${space.sm}px` }}>
        <Typography variant="overline">weights</Typography>
        <MonoText>button {typography.button.weight}</MonoText>
        <MonoText>
          overline {typography.overline.size}px / {typography.overline.weight} / {typography.overline.letterSpacing} /{' '}
          {typography.overline.lineHeight}
        </MonoText>
      </Stack>
    </Stack>
  ),
};
