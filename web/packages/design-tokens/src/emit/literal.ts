export type EmittedValue = string | number | EmittedValue[] | EmittedObject;
export type EmittedObject = { [key: string]: EmittedValue };

const MAX_LINE = 120;

export function quote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function literal(value: EmittedValue, indent: string): string {
  if (typeof value === 'string') return quote(value);
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return array(value, indent);
  const entries = Object.entries(value);
  if (entries.every(([, entry]) => typeof entry !== 'object')) {
    const line = `{ ${entries.map(([key, entry]) => `${key}: ${literal(entry, indent)}`).join(', ')} }`;
    if (indent.length + line.length <= MAX_LINE) return line;
  }
  const inner = `${indent}  `;
  return `{\n${entries.map(([key, entry]) => `${inner}${key}: ${literal(entry, inner)},\n`).join('')}${indent}}`;
}

// An ordered list stays a list: `series[0]` is the first chart colour, not a key called '0'.
function array(value: EmittedValue[], indent: string): string {
  const line = `[${value.map((entry) => literal(entry, indent)).join(', ')}]`;
  if (indent.length + line.length <= MAX_LINE) return line;
  const inner = `${indent}  `;
  return `[\n${value.map((entry) => `${inner}${literal(entry, inner)},\n`).join('')}${indent}]`;
}
