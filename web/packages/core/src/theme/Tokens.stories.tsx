import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box, Stack, Typography } from '@mui/material';
import { themeInputs } from '@atlas/design-tokens';
import type { PaletteInputs } from '@atlas/design-tokens';
import { THEME_MODES } from './build/createAtlasTheme';

const meta = {
  title: 'Theme/Tokens',
  parameters: { controls: { disable: true } },
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

const { font, radius, space } = themeInputs;

// A docs table column, off the space scale like everything else.
const swatchColumnWidth = themeInputs.space.xl * 5;

function MonoText({ children }: { children: ReactNode }) {
  return (
    <Typography variant="caption" sx={{ fontFamily: font.mono, overflowWrap: 'anywhere' }}>
      {children}
    </Typography>
  );
}

function swatchesOf(palette: PaletteInputs): ReadonlyArray<[role: string, value: string]> {
  return [
    ['primary.main', palette.primary.main],
    ['primary.light', palette.primary.light],
    ['primary.contrastText', palette.primary.contrastText],
    ['secondary.main', palette.secondary.main],
    ['success.main', palette.success.main],
    ['warning.main', palette.warning.main],
    ['error.main', palette.error.main],
    ['info.main', palette.info.main],
    ['text.primary', palette.text.primary],
    ['text.secondary', palette.text.secondary],
    ['divider', palette.divider],
    ['background.default', palette.background.default],
    ['background.paper', palette.background.paper],
  ];
}

function Swatch({ role, value, outline }: { role: string; value: string; outline: string }) {
  return (
    <Stack sx={{ gap: `${space.xs}px`, minWidth: 0 }}>
      <Box sx={{ height: space.xl, borderRadius: `${radius.control}px`, bgcolor: value, border: outline }} />
      <Typography variant="caption">{role}</Typography>
      <MonoText>{value}</MonoText>
    </Stack>
  );
}

function PalettePanel({ label, palette }: { label: string; palette: PaletteInputs }) {
  const outline = `${palette.border.width}px solid ${palette.border.color}`;
  const contained = palette.buttonContained;
  return (
    <Stack
      sx={{
        gap: `${space.md}px`,
        padding: `${space.lg}px`,
        border: outline,
        borderRadius: `${radius.surface}px`,
        bgcolor: palette.background.default,
        color: palette.text.primary,
      }}
    >
      <Typography variant="overline">{label}</Typography>
      <Box
        sx={{
          display: 'grid',
          gap: `${space.md}px`,
          gridTemplateColumns: `repeat(auto-fill, minmax(${swatchColumnWidth}px, 1fr))`,
        }}
      >
        {swatchesOf(palette).map(([role, value]) => (
          <Swatch key={role} role={role} value={value} outline={outline} />
        ))}
      </Box>
      <MonoText>
        border {outline} · focus {palette.focus.width}px {palette.focus.color}
        {contained ? ` · contained ${contained.text} on ${contained.background}` : ''}
      </MonoText>
    </Stack>
  );
}

export const Palettes: Story = {
  render: () => (
    <Stack sx={{ gap: `${space.xl}px` }}>
      {THEME_MODES.map((themeMode) => (
        <PalettePanel key={themeMode.id} label={themeMode.label} palette={themeInputs.palettes[themeMode.id]} />
      ))}
    </Stack>
  ),
};
