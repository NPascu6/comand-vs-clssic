// The library underneath, re-exported so an application never installs it.
//
// The owned API comes first: reach for `@atlas/core`, and drop to `@atlas/core/mui` only for
// something the design system does not wrap yet — a gap worth reporting, not a habit. Coming
// through here means one copy of MUI and one Emotion cache, whoever is asking.

export * from '@mui/material';
