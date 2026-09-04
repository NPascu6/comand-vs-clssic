import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../test/renderWithTheme';
import { RENDERED_PALETTE, emittedValuesOf } from '../test/emittedColor';
import { Button } from './Button';

describe('Button', () => {
  it('names itself after its children', () => {
    renderWithTheme(<Button>Save fund</Button>);
    expect(screen.getByRole('button', { name: 'Save fund' })).toBeInTheDocument();
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn();
    renderWithTheme(<Button onClick={onClick}>Save fund</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save fund' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('takes no clicks while loading', () => {
    renderWithTheme(<Button loading>Save fund</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('paints the solid variant from its own tokens', () => {
    renderWithTheme(<Button variant="solid">Save fund</Button>);
    const solid = screen.getByRole('button');
    expect(emittedValuesOf(solid, 'background-color')).toContain(RENDERED_PALETTE.primary.main);
    expect(emittedValuesOf(solid, 'color')).toContain(RENDERED_PALETTE.primary.contrastText);
  });

  it('takes its height from the button token, so an override resizes it', () => {
    renderWithTheme(<Button>Save fund</Button>, { tokens: { components: { button: { heightMd: 56 } } } });
    expect(emittedValuesOf(screen.getByRole('button'), 'min-height')).toContain('56px');
  });
});
