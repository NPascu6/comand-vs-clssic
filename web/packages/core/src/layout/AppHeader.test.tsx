import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Brand } from './Brand';
import { AppHeader, MenuButton } from './AppHeader';
import { renderWithTheme } from '../test/renderWithTheme';
import { emittedValuesOf } from '../test/emittedColor';

const bar = (banner: HTMLElement) => banner.firstElementChild as HTMLElement;

describe('AppHeader', () => {
  it('takes its height from the header token, so an override resizes it', () => {
    const { getByRole } = renderWithTheme(<AppHeader position="static">bar</AppHeader>, {
      tokens: { components: { header: { height: 96 } } },
    });
    expect(emittedValuesOf(bar(getByRole('banner')), 'min-height')).toContain('96px');
  });

  it('takes the compact height from its own token', () => {
    const { getByRole } = renderWithTheme(
      <AppHeader position="static" size="compact">
        bar
      </AppHeader>,
    );
    expect(emittedValuesOf(bar(getByRole('banner')), 'min-height')).toContain('48px');
  });

  it('drops its rule when it is told not to be bordered', () => {
    const { getByRole } = renderWithTheme(
      <AppHeader position="static" bordered={false}>
        bar
      </AppHeader>,
    );
    expect(emittedValuesOf(getByRole('banner'), 'border-block-end')).toContain('none');
  });

  it('sits on the surface it is asked for', () => {
    const { getByRole } = renderWithTheme(
      <AppHeader position="static" surface="transparent">
        bar
      </AppHeader>,
    );
    expect(emittedValuesOf(getByRole('banner'), 'background-color')).toContain('transparent');
  });

  it('carries the side-menu button only when it is given a handler', () => {
    const { queryByRole, rerender } = renderWithTheme(<AppHeader position="static">bar</AppHeader>);
    expect(queryByRole('button', { name: 'Menu' })).toBeNull();

    rerender(
      <AppHeader position="static" onMenuToggle={() => undefined}>
        bar
      </AppHeader>,
    );
    expect(queryByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('says whether the side menu is open, and calls back when asked to toggle', async () => {
    const toggles: number[] = [];
    const { getByRole } = renderWithTheme(
      <AppHeader position="static" onMenuToggle={() => toggles.push(1)} menuOpen menuLabel="Navigation">
        bar
      </AppHeader>,
    );
    const button = getByRole('button', { name: 'Navigation' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(button);
    expect(toggles).toHaveLength(1);
  });

  it('takes a custom glyph for the menu button', () => {
    const { getByTestId } = renderWithTheme(
      <AppHeader position="static" onMenuToggle={() => undefined} menuIcon={<svg data-testid="burger" viewBox="0 0 24 24" />}>
        bar
      </AppHeader>,
    );
    expect(getByTestId('burger')).toBeInTheDocument();
  });

  it('puts adornments at each end, around the content', () => {
    const { getByRole, getByText } = renderWithTheme(
      <AppHeader position="static" start={<button type="button">Back</button>} end={<button type="button">Sign out</button>}>
        <Brand name="Atlas" />
      </AppHeader>,
    );
    const row = bar(getByRole('banner'));
    expect(row.children).toHaveLength(3);
    expect(row.firstElementChild).toContainElement(getByText('Back'));
    expect(row.lastElementChild).toContainElement(getByText('Sign out'));
  });

  it('has no leading row at all when there is neither a menu nor a start', () => {
    const { getByRole } = renderWithTheme(<AppHeader position="static">bar</AppHeader>);
    expect(bar(getByRole('banner')).children).toHaveLength(1);
  });

  it('lets the content take the free space, so the end holds the far edge', () => {
    const { getByRole } = renderWithTheme(
      <AppHeader position="static" end={<button type="button">Sign out</button>}>
        bar
      </AppHeader>,
    );
    expect(emittedValuesOf(bar(getByRole('banner')).firstElementChild!, 'flex')).toContain('1');
  });
});

describe('MenuButton', () => {
  it('stands on its own, for a bar built by hand', async () => {
    const toggles: number[] = [];
    const { getByRole } = renderWithTheme(<MenuButton onToggle={() => toggles.push(1)} label="Side menu" />);
    await userEvent.click(getByRole('button', { name: 'Side menu' }));
    expect(toggles).toHaveLength(1);
  });
});
