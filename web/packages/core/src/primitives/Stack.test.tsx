import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../test/renderWithTheme';
import { Stack } from './Stack';

describe('Stack', () => {
  it('submits on Enter when it is the form', async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    renderWithTheme(
      <Stack component="form" onSubmit={onSubmit}>
        <input aria-label="Fund name" />
        <button type="submit">Save</button>
      </Stack>,
    );

    await userEvent.type(screen.getByLabelText('Fund name'), 'Alpha{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('forwards className to its root', () => {
    const { container } = renderWithTheme(<Stack className="stack-mark">rows</Stack>);
    expect(container.firstElementChild).toHaveClass('stack-mark');
  });
});

