import { describe, expect, it } from 'vitest';
import { themeInputs } from '@atlas/design-tokens';
import { Button } from '../controls/Button';
import { Stack } from '../primitives/Stack';
import { AtlasTokenScope } from './AtlasTokenScope';
import { useAtlasTokens } from './useAtlasTokens';
import { renderWithTheme } from '../test/renderWithTheme';
import { emittedValuesOf } from '../test/emittedColor';

// A client application re-skins with tokens and never with CSS. That claim is only true if an
// override reaches what is actually rendered — so these read the emitted rules, not the theme.

function Probe() {
  const tokens = useAtlasTokens();
  return <span data-testid="probe">{`${tokens.components.button.radius}/${tokens.palettes.light.primary.main}`}</span>;
}

const buttonIn = (container: HTMLElement) => container.querySelector('button')!;

describe('token overrides', () => {
  it('reach the rendered rules, not only the theme object', () => {
    const plain = renderWithTheme(<Button>Commit</Button>);
    const before = emittedValuesOf(buttonIn(plain.container), 'border-radius');
    plain.unmount();

    const skinned = renderWithTheme(<Button>Commit</Button>, { tokens: { components: { button: { radius: 2 } } } });
    const after = emittedValuesOf(buttonIn(skinned.container), 'border-radius');

    expect(before).not.toEqual([]);
    expect(after).toContain('2px');
    expect(after).not.toEqual(before);
  });

  it('reach the spacing scale, which is a token like any other', () => {
    const plain = renderWithTheme(<Stack gap="md">x</Stack>);
    const before = emittedValuesOf(plain.container.firstElementChild!, 'gap');
    plain.unmount();

    const skinned = renderWithTheme(<Stack gap="md">x</Stack>, { tokens: { space: { md: 40 } } });

    expect(before).toContain(`${themeInputs.space.md}px`);
    expect(emittedValuesOf(skinned.container.firstElementChild!, 'gap')).toContain('40px');
  });

  it('reach a component that sizes itself from a component token', () => {
    const { container } = renderWithTheme(<Button size="md">Commit</Button>, {
      tokens: { components: { button: { heightMd: 64 } } },
    });

    expect(emittedValuesOf(buttonIn(container), 'min-height')).toContain('64px');
  });

  it('leave the shipped tokens alone', () => {
    const shipped = themeInputs.components.button.radius;
    renderWithTheme(<Button>Commit</Button>, { tokens: { components: { button: { radius: 2 } } } });

    expect(themeInputs.components.button.radius).toBe(shipped);
    expect(shipped).not.toBe(2);
  });

  it('are readable by a component through useAtlasTokens', () => {
    const { getByTestId } = renderWithTheme(<Probe />, {
      tokens: { components: { button: { radius: 3 } }, palettes: { light: { primary: { main: '#ABCDEF' } } } },
    });

    expect(getByTestId('probe').textContent).toBe('3/#ABCDEF');
  });

  it('scope to a subtree, and nest', () => {
    const { getAllByTestId } = renderWithTheme(
      <>
        <Probe />
        <AtlasTokenScope tokens={{ components: { button: { radius: 8 } } }}>
          <Probe />
          <AtlasTokenScope tokens={{ palettes: { light: { primary: { main: '#123456' } } } }}>
            <Probe />
          </AtlasTokenScope>
        </AtlasTokenScope>
      </>,
    );
    const [outer, middle, inner] = getAllByTestId('probe').map((node) => node.textContent);

    expect(outer).toBe(`${themeInputs.components.button.radius}/${themeInputs.palettes.light.primary.main}`);
    expect(middle).toBe(`8/${themeInputs.palettes.light.primary.main}`);
    // The inner scope keeps what the middle one set and adds its own.
    expect(inner).toBe('8/#123456');
  });
});
