import { Stack, Text } from '@atlas/core';
import { TextField } from '@atlas/core/mui';
import type { JsonValue } from '@atlas/design-tokens';
import { isAlias } from './tokens';
import type { EditableToken } from './tokens';

interface TokenFieldProps {
  token: EditableToken;
  onChange: (value: JsonValue) => void;
}

const asText = (value: JsonValue): string => (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value));

/** An input for one token, chosen by its DTCG `$type`. A colour that is an alias is edited as the alias. */
export function TokenField({ token, onChange }: TokenFieldProps) {
  const { type, value } = token;
  const colour = type === 'color' && !isAlias(value) && typeof value === 'string' && value.startsWith('#');
  const numeric = type === 'number' || type === 'fontWeight';
  const dimension = type === 'dimension' && typeof value === 'string' && value.endsWith('px');
  return (
    <Stack direction="row" gap="sm" align="center">
      <Text variant="caption" tone="muted" sx={{ minWidth: 'var(--atlas-space-xl)', flex: 1 }}>
        {token.path}
      </Text>
      {colour ? <input type="color" value={value.slice(0, 7)} onChange={(event) => onChange(event.target.value.toUpperCase())} aria-label={`${token.path} colour`} /> : null}
      <TextField
        size="small"
        type={numeric || dimension ? 'number' : 'text'}
        value={dimension ? Number.parseFloat(value) : asText(value)}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(dimension ? `${raw}px` : numeric ? Number(raw) : raw);
        }}
        slotProps={{ htmlInput: { 'aria-label': token.path } }}
        sx={{ width: '16ch' }}
      />
      <Text variant="caption" tone="muted" sx={{ width: '9ch' }}>
        {type}
      </Text>
    </Stack>
  );
}
