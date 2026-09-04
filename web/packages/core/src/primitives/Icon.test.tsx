import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../test/renderWithTheme';
import { emittedValuesOf } from '../test/emittedColor';
import { Icon } from './Icon';

const mark = (
  <svg data-testid="mark" viewBox="0 0 24 24">
    <path d="M12 2 2 22h20Z" />
  </svg>
);

describe('Icon', () => {
  it('draws whatever it is given', () => {
    renderWithTheme(<Icon>{mark}</Icon>);
    expect(screen.getByTestId('mark')).toBeInTheDocument();
  });

  it('takes its square from the icon tokens', () => {
    renderWithTheme(<Icon size="lg">{mark}</Icon>);
    expect(emittedValuesOf(screen.getByTestId('mark').parentElement!, 'width')).toContain('24px');
  });

  it('follows an override of those tokens', () => {
    renderWithTheme(<Icon>{mark}</Icon>, { tokens: { components: { icon: { sizeMd: 32 } } } });
    expect(emittedValuesOf(screen.getByTestId('mark').parentElement!, 'width')).toContain('32px');
  });

  it('is decorative unless it is given a label', () => {
    const { rerender } = renderWithTheme(<Icon>{mark}</Icon>);
    expect(screen.getByTestId('mark').parentElement).toHaveAttribute('aria-hidden', 'true');

    rerender(<Icon label="Rising">{mark}</Icon>);
    expect(screen.getByRole('img', { name: 'Rising' })).toBeInTheDocument();
  });
});
