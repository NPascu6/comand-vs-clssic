import type { Meta, StoryObj } from '@storybook/react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Button } from '../controls/Button';
import { IconButton } from '../controls/IconButton';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { Page } from './Page';

const meta = {
  title: 'Layout/Page',
  component: Page,
  args: {
    title: 'Atlas Alpha',
    description: 'As at close',
    direction: 'column',
    children: (
      <>
        <Text>Twelve positions across four strategies.</Text>
        <Text tone="muted">Every value on this page comes from the layout tokens.</Text>
      </>
    ),
  },
  argTypes: {
    title: { control: 'text', description: 'With one, the page grows a header row; without, it is only its body' },
    description: { control: 'text' },
    direction: { control: 'inline-radio', options: ['column', 'row'], description: 'How the body flows' },
    start: { control: false },
    actions: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Page>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Inset and rhythm are `layout.contentPadding` and `layout.contentGap` — the page picks neither. */
export const Playground: Story = {};

/** No title: the page is only its body. */
export const Untitled: Story = { args: { title: undefined, description: undefined } };

/** A back arrow before the title, the page's actions after it — held to the far edge even wrapped. */
export const TitleRow: Story = {
  args: {
    start: <IconButton icon={<ArrowBackIcon fontSize="small" />} aria-label="Back to funds" />,
    actions: (
      <>
        <Button variant="outline">Review</Button>
        <Button>Commit capital</Button>
      </>
    ),
  },
};

/** A row flows the body across the page instead of down it. */
export const RowBody: Story = {
  args: {
    direction: 'row',
    children: (
      <>
        <Stack gap="sm">
          <Text variant="heading">Committed</Text>
          <Text>EUR 25.0m</Text>
        </Stack>
        <Stack gap="sm">
          <Text variant="heading">Called</Text>
          <Text>EUR 18.4m</Text>
        </Stack>
        <Stack gap="sm">
          <Text variant="heading">Remaining</Text>
          <Text>EUR 6.6m</Text>
        </Stack>
      </>
    ),
  },
};
