import type { Meta, StoryObj } from '@storybook/react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import type { ColorToken, ThemeOverrides } from '@atlas/design-tokens';
import { themeInputs } from '@atlas/design-tokens';
import { Button } from '../controls/Button';
import { IconButton } from '../controls/IconButton';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { AppHeader } from '../layout/AppHeader';
import { Brand } from '../layout/Brand';
import { Page } from '../layout/Page';
import { AtlasTokenScope } from './AtlasTokenScope';

const { components, palettes, typography, space } = themeInputs;
const LIGHT = palettes.light;

/**
 * Every control on the right is a design token. Drag one and the whole page answers, because no
 * component below names a size, a weight or a colour — they read `styles.css`, which reads the
 * custom properties these set. This is what a designer changes in Figma; the sync turns the same
 * values into a pull request.
 */
interface PlaygroundArgs {
  headerHeight: number;
  headerPaddingInline: number;
  headerAdornmentSize: number;
  headerAdornmentGap: number;
  buttonHeight: number;
  buttonPaddingInline: number;
  buttonRadius: number;
  buttonFontWeight: number;
  buttonSolidBackground: string;
  buttonSolidText: string;
  titleSize: number;
  bodySize: number;
  contentPadding: number;
  contentGap: number;
}

const overridesOf = (args: PlaygroundArgs): ThemeOverrides => ({
  layout: { contentPadding: args.contentPadding, contentGap: args.contentGap },
  typography: { title: { size: args.titleSize }, body: { size: args.bodySize } },
  components: {
    header: {
      height: args.headerHeight,
      paddingInline: args.headerPaddingInline,
      adornmentSize: args.headerAdornmentSize,
      adornmentGap: args.headerAdornmentGap,
    },
    button: {
      heightMd: args.buttonHeight,
      paddingInlineMd: args.buttonPaddingInline,
      radius: args.buttonRadius,
      fontWeight: args.buttonFontWeight,
      // Storybook's colour control hands back a CSS colour; a token is one too.
      solidBackground: args.buttonSolidBackground as ColorToken,
      solidText: args.buttonSolidText as ColorToken,
    },
  },
});

const meta = {
  title: 'Theme/Token playground',
  args: {
    headerHeight: components.header.height,
    headerPaddingInline: components.header.paddingInline,
    headerAdornmentSize: components.header.adornmentSize,
    headerAdornmentGap: components.header.adornmentGap,
    buttonHeight: components.button.heightMd,
    buttonPaddingInline: components.button.paddingInlineMd,
    buttonRadius: components.button.radius,
    buttonFontWeight: components.button.fontWeight,
    buttonSolidBackground: LIGHT.primary.main,
    buttonSolidText: LIGHT.primary.contrastText,
    titleSize: typography.title.size,
    bodySize: typography.body.size,
    contentPadding: space.lg,
    contentGap: space.lg,
  },
  argTypes: {
    headerHeight: { control: { type: 'range', min: 40, max: 120, step: 2 } },
    headerPaddingInline: { control: { type: 'range', min: 0, max: 64, step: 2 } },
    headerAdornmentSize: { control: { type: 'range', min: 24, max: 64, step: 2 } },
    headerAdornmentGap: { control: { type: 'range', min: 0, max: 32, step: 2 } },
    buttonHeight: { control: { type: 'range', min: 24, max: 72, step: 2 } },
    buttonPaddingInline: { control: { type: 'range', min: 0, max: 48, step: 2 } },
    buttonRadius: { control: { type: 'range', min: 0, max: 32, step: 1 } },
    buttonFontWeight: { control: { type: 'range', min: 300, max: 900, step: 100 } },
    buttonSolidBackground: { control: 'color' },
    buttonSolidText: { control: 'color' },
    titleSize: { control: { type: 'range', min: 16, max: 48, step: 1 } },
    bodySize: { control: { type: 'range', min: 11, max: 24, step: 1 } },
    contentPadding: { control: { type: 'range', min: 0, max: 64, step: 4 } },
    contentGap: { control: { type: 'range', min: 0, max: 64, step: 4 } },
  },
} satisfies Meta<PlaygroundArgs>;
export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** A whole screen, retuned live. Nothing here is styled by the story. */
export const Screen: Story = {
  render: (args) => (
    <AtlasTokenScope tokens={overridesOf(args)}>
      <AppHeader
        position="static"
        onMenuToggle={() => undefined}
        menuLabel="Side menu"
        end={<IconButton icon={<NotificationsIcon fontSize="small" />} aria-label="Notifications" />}
      >
        <Brand name="Atlas" subtitle="Fund administration" />
      </AppHeader>
      <Page
        title="Atlas Alpha"
        description="Every value on this page is a token; the panel on the right is the Figma file."
        actions={
          <>
            <Button variant="outline">Review</Button>
            <Button>Commit capital</Button>
          </>
        }
      >
        <Text>
          A designer moves these in Figma. The sync validates the export against the theme contract
          and WCAG AA, versions it, records who published it, and opens the pull request.
        </Text>
        <Stack direction="row" gap="sm" wrap>
          <Button variant="solid">Solid</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </Stack>
      </Page>
    </AtlasTokenScope>
  ),
};

/** The same tokens, read back — what the sync would write, and what the pull request would show. */
export const AsTokens: Story = {
  render: (args) => (
    <Page title="What the designer changed">
      <Stack gap="xs">
        {Object.entries(overridesFlat(args)).map(([path, value]) => (
          <Text key={path} variant="caption" tone="muted">
            {path} — {String(value)}
          </Text>
        ))}
      </Stack>
    </Page>
  ),
};

function overridesFlat(args: PlaygroundArgs): Record<string, string | number> {
  return {
    'layout.contentPadding': args.contentPadding,
    'layout.contentGap': args.contentGap,
    'typography.title.size': args.titleSize,
    'typography.body.size': args.bodySize,
    'component.header.height': args.headerHeight,
    'component.header.paddingInline': args.headerPaddingInline,
    'component.header.adornmentSize': args.headerAdornmentSize,
    'component.header.adornmentGap': args.headerAdornmentGap,
    'component.button.heightMd': args.buttonHeight,
    'component.button.paddingInlineMd': args.buttonPaddingInline,
    'component.button.radius': args.buttonRadius,
    'component.button.fontWeight': args.buttonFontWeight,
    'component.button.solidBackground': args.buttonSolidBackground,
    'component.button.solidText': args.buttonSolidText,
  };
}
