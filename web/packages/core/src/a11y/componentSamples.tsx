import type { ReactElement } from 'react';
import { AppHeader, Brand, Button, IconButton, Page, Stack, Text } from '../index';

export type ComponentGroup = 'primitives' | 'controls' | 'layout';

export interface ComponentSample {
  id: string;
  group: ComponentGroup;
  render: () => ReactElement;
}

const noop = () => undefined;

/** One rendering of every component, so the axe and contrast gates cover the whole library. */
export const COMPONENT_SAMPLES: readonly ComponentSample[] = [
  { id: 'Text', group: 'primitives', render: () => <Text variant="title">Atlas Alpha</Text> },
  { id: 'Stack', group: 'primitives', render: () => (
    <Stack gap="sm">
      <Text>Committed</Text>
      <Text>Called</Text>
    </Stack>
  ) },

  { id: 'Button', group: 'controls', render: () => <Button onClick={noop}>Commit capital</Button> },
  { id: 'IconButton', group: 'controls', render: () => (
    <IconButton icon={<span aria-hidden>+</span>} aria-label="Add" onClick={noop} />
  ) },

  { id: 'AppHeader', group: 'layout', render: () => (
    <AppHeader position="static" end={<Button>Sign out</Button>}>
      <Brand name="Atlas" subtitle="Fund administration" />
    </AppHeader>
  ) },
  { id: 'Brand', group: 'layout', render: () => <Brand name="Atlas" subtitle="Fund administration" /> },
  { id: 'Page', group: 'layout', render: () => (
    <Page>
      <Text>Twelve positions</Text>
    </Page>
  ) },
];
