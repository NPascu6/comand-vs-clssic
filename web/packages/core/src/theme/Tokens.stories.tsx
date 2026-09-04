import type { Meta, StoryObj } from '@storybook/react';
import { Box, Stack, Typography } from '@mui/material';
import { themeInputs } from '@atlas/design-tokens';
import type { PaletteInputs } from '@atlas/design-tokens';
import { Card } from '../layout/Card';
import { Section } from '../layout/Section';
import { Mono } from '../data-display/Mono';
import { THEME_MODES } from './createAtlasTheme';

// The page to open after re-exporting from Figma: every swatch, type sample and radius, read from the generated inputs.
const meta = {
  title: 'Theme/Tokens',
  parameters: { controls: { disable: true } },
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

const { font, radius, typography } = themeInputs;

function swatches(palette: PaletteInputs): ReadonlyArray<[role: string, value: string]> {
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
    <Stack sx={{ width: 120, gap: 0.5 }}>
      <Box sx={{ height: 40, borderRadius: `${radius.control}px`, bgcolor: value, border: outline }} />
      <Typography variant="caption" sx={{ lineHeight: 1.2 }}>
        {role}
      </Typography>
      <Mono sx={{ overflowWrap: 'anywhere' }}>{value}</Mono>
    </Stack>
  );
}

/** One mode on its own background, text colour and border, so the swatches read in context. */
function ModeRow({ label, palette }: { label: string; palette: PaletteInputs }) {
  const outline = `${palette.border.width}px solid ${palette.border.color}`;
  const contained = palette.buttonContained;
  return (
    <Section title={label}>
      <Card sx={{ bgcolor: palette.background.default, color: palette.text.primary, border: outline }}>
        <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap' }}>
          {swatches(palette).map(([role, value]) => (
            <Swatch key={role} role={role} value={value} outline={outline} />
          ))}
        </Stack>
        <Mono sx={{ display: 'block', mt: 2 }}>
          border {outline} · focus {palette.focus.width}px {palette.focus.color}
          {contained ? ` · contained ${contained.text} on ${contained.background}` : ''}
        </Mono>
      </Card>
    </Section>
  );
}

function TypeSample() {
  const { overline, tableHeader, button, chip } = typography;
  return (
    <Section title="Typography">
      <Card>
        <Stack sx={{ gap: 1 }}>
          <Typography>Sans — Fund I committed EUR 25M across 12 assets</Typography>
          <Mono>{font.sans}</Mono>
          <Mono>{font.mono}</Mono>
          <Typography variant="overline">
            overline {overline.size}px / {overline.weight} / {overline.letterSpacing} / {overline.lineHeight}
          </Typography>
          <Typography variant="button">button weight {button.weight}</Typography>
          <Typography sx={{ fontWeight: chip.weight }}>chip weight {chip.weight}</Typography>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: tableHeader.size,
              fontWeight: tableHeader.weight,
              letterSpacing: tableHeader.letterSpacing,
              textTransform: 'uppercase',
            }}
          >
            table header {tableHeader.size}px / {tableHeader.weight} / {tableHeader.letterSpacing}
          </Typography>
        </Stack>
      </Card>
    </Section>
  );
}

function RadiusSample() {
  return (
    <Section title="Radius">
      <Card>
        <Stack direction="row" sx={{ gap: 3 }}>
          {(['control', 'surface'] as const).map((name) => (
            <Stack key={name} sx={{ gap: 0.5 }}>
              <Box
                sx={{
                  width: 96,
                  height: 48,
                  borderRadius: `${radius[name]}px`,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              />
              <Typography variant="caption">{name}</Typography>
              <Mono>{radius[name]}px</Mono>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Section>
  );
}

export const Default: Story = {
  render: () => (
    <Stack sx={{ gap: 3 }}>
      {Object.entries(themeInputs.palettes).map(([mode, palette]) => (
        <ModeRow key={mode} label={THEME_MODES.find((themeMode) => themeMode.id === mode)?.label ?? mode} palette={palette} />
      ))}
      <TypeSample />
      <RadiusSample />
    </Stack>
  ),
};
