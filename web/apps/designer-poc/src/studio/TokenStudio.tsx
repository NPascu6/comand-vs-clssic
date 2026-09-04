import { useMemo, useState } from 'react';
import { AtlasTokenScope, Button, Stack, Text } from '@atlas/core';
import { checkContrast, parseDtcgFiles, transform } from '@atlas/design-tokens';
import type { DtcgFile, JsonValue, ThemeInputs, ThemeMode } from '@atlas/design-tokens';
import { diffTokens } from '@atlas/figma-sync';
import base from '../../../../packages/design-tokens/figma/Atlas.Base.tokens.json';
import light from '../../../../packages/design-tokens/figma/Atlas.Light.tokens.json';
import dark from '../../../../packages/design-tokens/figma/Atlas.Dark.tokens.json';
import contrast from '../../../../packages/design-tokens/figma/Atlas.Contrast.tokens.json';
import { listTokens, withValue } from './tokens';
import { TokenField } from './TokenField';

const COMMITTED: DtcgFile[] = [
  { name: 'Atlas.Base.tokens.json', json: base as JsonValue },
  { name: 'Atlas.Light.tokens.json', json: light as JsonValue },
  { name: 'Atlas.Dark.tokens.json', json: dark as JsonValue },
  { name: 'Atlas.Contrast.tokens.json', json: contrast as JsonValue },
];

const MODES: readonly ThemeMode[] = ['light', 'dark', 'contrast'];

type Built = { ok: true; theme: ThemeInputs } | { ok: false; reason: string };

/** The same engine the sync runs, in the browser: every keystroke is parsed, transformed and gated. */
function build(files: DtcgFile[]): Built {
  try {
    return { ok: true, theme: transform(parseDtcgFiles(files)) };
  } catch (thrown) {
    return { ok: false, reason: thrown instanceof Error ? thrown.message : String(thrown) };
  }
}

interface TokenStudioProps {
  /** What to draw with the edited tokens — the proof of concept's own panels. */
  preview: React.ReactNode;
}

export function TokenStudio({ preview }: TokenStudioProps) {
  const [files, setFiles] = useState(COMMITTED);
  const [file, setFile] = useState(COMMITTED[0].name);
  const [saved, setSaved] = useState<string>();

  const tokens = useMemo(() => listTokens(files).filter((token) => token.file === file), [files, file]);
  const built = useMemo(() => build(files), [files]);
  const changes = useMemo(() => diffTokens(COMMITTED, files), [files]);
  const findings = useMemo(
    () => (built.ok ? MODES.flatMap((mode) => checkContrast(built.theme.palettes[mode]).map((finding) => `${mode}: ${finding.id} ${finding.ratio.toFixed(2)}:1`)) : []),
    [built],
  );

  async function save() {
    const response = await fetch('/__tokens', { method: 'POST', body: JSON.stringify(files) });
    setSaved(await response.text());
  }

  return (
    <Stack direction="row" gap="lg" align="start" wrap>
      <Stack gap="md" sx={{ flex: '1 1 28rem', minWidth: 0 }}>
        <Stack direction="row" gap="xs" wrap>
          {COMMITTED.map((entry) => (
            <Button key={entry.name} size="sm" variant={entry.name === file ? 'solid' : 'outline'} onClick={() => setFile(entry.name)}>
              {entry.name.replace('.tokens.json', '')}
            </Button>
          ))}
        </Stack>
        <Stack gap="xs">
          {tokens.map((token) => (
            <TokenField key={token.path} token={token} onChange={(value) => setFiles(withValue(files, token.file, token.path, value))} />
          ))}
        </Stack>
      </Stack>

      <Stack gap="md" sx={{ flex: '1 1 24rem', minWidth: 0 }}>
        {built.ok ? <AtlasTokenScope tokens={built.theme}>{preview}</AtlasTokenScope> : <Text tone="danger">{built.reason}</Text>}

        <Stack gap="xs">
          <Text variant="heading">{changes.length === 0 ? 'No change' : `${changes.length} token${changes.length === 1 ? '' : 's'} changed`}</Text>
          {changes.map((change) => (
            <Text key={`${change.mode}.${change.path}`} variant="caption" tone="muted">
              {change.mode} {change.path} — {change.before ?? '∅'} → {change.after ?? '∅'}
            </Text>
          ))}
          {findings.map((finding) => (
            <Text key={finding} variant="caption" tone="danger">
              {finding}
            </Text>
          ))}
        </Stack>

        <Stack direction="row" gap="sm" align="center" wrap>
          <Button onClick={save} disabled={!built.ok || changes.length === 0 || findings.length > 0}>
            Save as export
          </Button>
          <Button variant="ghost" onClick={() => setFiles(COMMITTED)} disabled={changes.length === 0}>
            Reset
          </Button>
        </Stack>
        {saved ? (
          <Text variant="caption" tone="muted">
            {saved}
          </Text>
        ) : (
          <Text variant="caption" tone="muted">
            Saving writes a DTCG export the sync consumes — the same shape a Figma plugin exports — so the release still goes
            through every gate rather than around them.
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
