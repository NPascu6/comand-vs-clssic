import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CloseIcon from '@mui/icons-material/Close';
import { renderWithTheme } from '../test/renderWithTheme';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('exposes the accessible name it requires', () => {
    renderWithTheme(<IconButton icon={<CloseIcon />} aria-label="Dismiss" />);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('keeps its icon out of the accessible name', () => {
    renderWithTheme(<IconButton icon={<CloseIcon />} aria-label="Dismiss" />);
    expect(screen.getByTestId('CloseIcon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn();
    renderWithTheme(<IconButton icon={<CloseIcon />} aria-label="Dismiss" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('takes no clicks while disabled', () => {
    renderWithTheme(<IconButton icon={<CloseIcon />} aria-label="Dismiss" onClick={vi.fn()} disabled />);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeDisabled();
  });
});
