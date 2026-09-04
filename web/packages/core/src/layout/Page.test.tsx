import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../test/renderWithTheme';
import { emittedValuesOf } from '../test/emittedColor';
import { Button } from '../controls/Button';
import { Page } from './Page';

const bodyOf = (container: HTMLElement) => container.firstElementChild!.lastElementChild as HTMLElement;

describe('Page', () => {
  it('is only a body when it is given no title', () => {
    const { container } = renderWithTheme(<Page>content</Page>);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(container.firstElementChild!.children).toHaveLength(1);
  });

  it('grows a header row when it is given one, with the title as the page heading', () => {
    renderWithTheme(
      <Page title="Atlas Alpha" description="As at close">
        content
      </Page>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Atlas Alpha');
    expect(screen.getByText('As at close')).toBeInTheDocument();
  });

  it('carries a start adornment and actions around the title', () => {
    renderWithTheme(
      <Page title="Atlas Alpha" start={<span>◀</span>} actions={<Button>Export</Button>}>
        content
      </Page>,
    );
    expect(screen.getByText('◀')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('flows its body down the page, or across it', () => {
    const { container, rerender } = renderWithTheme(<Page>content</Page>);
    expect(emittedValuesOf(bodyOf(container), 'flex-direction')).toContain('column');
    rerender(<Page direction="row">content</Page>);
    expect(emittedValuesOf(bodyOf(container), 'flex-direction')).toContain('row');
  });

  it('takes its inset from the layout token, so an override moves it', () => {
    const { container } = renderWithTheme(<Page>content</Page>, { tokens: { layout: { contentPadding: 48 } } });
    expect(emittedValuesOf(container.firstElementChild!, 'padding')).toContain('48px');
  });
});
