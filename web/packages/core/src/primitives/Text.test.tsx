import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../test/renderWithTheme';
import { RENDERED_PALETTE, emittedColorsOf, emittedValuesOf } from '../test/emittedColor';
import { Text } from './Text';

// The styles are a stylesheet keyed on classes now, so read the rules and resolve their tokens.
const valuesOf = (label: string, property: string) => emittedValuesOf(screen.getByText(label), property);

describe('Text', () => {
  it('clamps truncate to the requested number of lines', () => {
    renderWithTheme(<Text truncate={2}>clamped</Text>);
    expect(valuesOf('clamped', '-webkit-line-clamp')).toContain('2');
    expect(valuesOf('clamped', 'display')).toContain('-webkit-box');
    expect(valuesOf('clamped', 'overflow')).toContain('hidden');
  });

  it('leaves wrapping alone when it truncates', () => {
    renderWithTheme(<Text truncate={2}>clamped</Text>);
    expect(valuesOf('clamped', 'white-space')).not.toContain('nowrap');
  });

  it('clamps to a single line when asked for one', () => {
    renderWithTheme(<Text truncate={1}>single</Text>);
    expect(valuesOf('single', '-webkit-line-clamp')).toContain('1');
    expect(valuesOf('single', 'overflow')).toContain('hidden');
  });

  it('does not clamp when it is left to wrap', () => {
    renderWithTheme(<Text>flowing</Text>);
    expect(valuesOf('flowing', '-webkit-line-clamp')).toEqual([]);
    expect(valuesOf('flowing', 'overflow')).toEqual([]);
  });

  it('forwards className to its root', () => {
    renderWithTheme(<Text className="text-mark">marked</Text>);
    expect(screen.getByText('marked')).toHaveClass('text-mark');
  });

  it('paints each tone its own colour', () => {
    renderWithTheme(
      <>
        <Text tone="danger">breached</Text>
        <Text tone="success">cleared</Text>
      </>,
    );
    expect(emittedColorsOf(screen.getByText('breached'))).toEqual([RENDERED_PALETTE.error.main]);
    expect(emittedColorsOf(screen.getByText('cleared'))).toEqual([RENDERED_PALETTE.success.main]);
  });

  it('dims a muted tone to secondary text', () => {
    renderWithTheme(<Text tone="muted">aside</Text>);
    expect(emittedColorsOf(screen.getByText('aside'))).toEqual([RENDERED_PALETTE.text.secondary]);
  });

  it('paints nothing without a tone, so it inherits', () => {
    renderWithTheme(<Text>plain</Text>);
    expect(emittedColorsOf(screen.getByText('plain'))).toEqual([]);
  });

  it('keeps the clamp when is given alongside truncate', () => {
    renderWithTheme(
      <Text truncate={3}>
        both
      </Text>,
    );
    expect(valuesOf('both', '-webkit-line-clamp')).toContain('3');
    expect(valuesOf('both', 'white-space')).not.toContain('nowrap');
  });
});
