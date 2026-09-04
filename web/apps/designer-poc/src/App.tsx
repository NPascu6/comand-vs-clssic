import { useState } from 'react';
// The icons come from core too: the application installs one package, not MUI as well.
import { Notifications as BellIcon } from '@atlas/core/mui-icons';
import {
  AppHeader,
  AtlasTokenScope,
  Brand,
  Button,
  IconButton,
  Page,
  Stack,
  Text,
  ThemeSwitcher,
  useAtlasTokens,
} from '@atlas/core';
import type { TextVariant } from '@atlas/core';
import { PROPOSAL, PROPOSED_CHANGES } from './proposal';
import { TokenStudio } from './studio/TokenStudio';

const RAMP: readonly TextVariant[] = ['title', 'heading', 'subheading', 'body', 'bodySmall', 'caption'];

const SYNC_COMMAND = 'node web/packages/figma-sync/scripts/figma-sync.ts --fixture type-refresh --author-handle mara.ilic';

/** A token's path beside the value it resolves to — the pair a designer reads. */
function Token({ path, value }: { path: string; value: string | number }) {
  return (
    <Text variant="caption" tone="muted">
      {path} — {value}
    </Text>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap="sm">
      <Text variant="heading">{title}</Text>
      {children}
    </Stack>
  );
}

function Header() {
  const { header } = useAtlasTokens().components;
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Group title="Header">
      {/* Given a handler it carries the side-menu button; left out, the same bar has none. */}
      <AppHeader
        position="static"
        onMenuToggle={() => setMenuOpen(!menuOpen)}
        menuOpen={menuOpen}
        menuLabel="Side menu"
        end={<IconButton icon={<BellIcon />} aria-label="Notifications" />}
      >
        <Brand name="Atlas" subtitle="Fund administration" />
      </AppHeader>
      <AppHeader position="static" end={<IconButton icon={<BellIcon />} aria-label="Notifications" />}>
        <Brand name="Atlas" subtitle="No side menu" />
      </AppHeader>
      <Token path="component.header.height" value={`${header.height}px`} />
      <Token path="component.header.adornmentSize" value={`${header.adornmentSize}px`} />
      <Token path="component.header.adornmentGap" value={`${header.adornmentGap}px`} />
    </Group>
  );
}

function Typography() {
  const { typography } = useAtlasTokens();
  return (
    <Group title="Typography">
      {RAMP.map((variant) => (
        <Stack key={variant} gap="xs">
          <Text variant={variant}>{variant}</Text>
          <Token
            path={`typography.${variant}`}
            value={`${typography[variant].size}px · ${typography[variant].weight} · ${typography[variant].lineHeight}`}
          />
        </Stack>
      ))}
    </Group>
  );
}

function Buttons() {
  const { button } = useAtlasTokens().components;
  return (
    <Group title="Buttons">
      <Stack direction="row" gap="sm" align="center">
        <Button>Commit capital</Button>
        <Button variant="outline">Review</Button>
        <Button variant="ghost">Cancel</Button>
      </Stack>
      <Token path="component.button.heightMd" value={`${button.heightMd}px`} />
      <Token path="component.button.paddingInlineMd" value={`${button.paddingInlineMd}px`} />
      <Token path="component.button.radius" value={`${button.radius}px`} />
      <Token path="component.button.fontWeight" value={button.fontWeight} />
    </Group>
  );
}

/** The diff the sync prints and the pull request carries. */
function Release() {
  return (
    <Group title="…and how it ships">
      <Text variant="bodySmall" tone="muted">
        The designer publishes in Figma and CI runs one command. It checks the export against the theme contract and
        WCAG AA, versions the change, records who published it, and rewrites only the files whose values moved.
      </Text>
      <Text variant="caption">{SYNC_COMMAND}</Text>
      <Text variant="caption" tone="muted">
        design tokens 1.0.0 → 1.0.1 (patch) by Mara Ilic — 1 file rewritten
      </Text>
      {PROPOSED_CHANGES.map(([path, before, after]) => (
        <Token key={path} path={path} value={`${before} → ${after}`} />
      ))}
    </Group>
  );
}

export function App() {
  const [proposed, setProposed] = useState(false);
  const [studio, setStudio] = useState(false);
  const preview = (
    <Stack gap="lg">
      <Header />
      <Typography />
      <Buttons />
    </Stack>
  );

  return (
    <Page
      title="Design tokens → pull request"
      description="Nothing on this page sets a size, a weight, a height or a radius. Every one of them is a token owned in Figma, so a designer changes what you see here without a React change."
      actions={
        <>
          <Button variant={studio ? 'solid' : 'outline'} onClick={() => setStudio(!studio)}>
            {studio ? 'Back to the proof of concept' : 'Open the token studio'}
          </Button>
          {studio ? null : (
            <Button variant={proposed ? 'solid' : 'outline'} onClick={() => setProposed(!proposed)}>
              {proposed ? "Showing the designer's change" : "Preview the designer's change"}
            </Button>
          )}
          <ThemeSwitcher />
        </>
      }
    >
      {studio ? (
        <TokenStudio preview={preview} />
      ) : (
        <>
          <AtlasTokenScope tokens={proposed ? PROPOSAL : {}}>{preview}</AtlasTokenScope>
          <Release />
        </>
      )}
    </Page>
  );
}
