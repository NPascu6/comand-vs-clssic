// The Atlas design system, owned by `core`. The app consumes this preset, so the
// palette/scale live in ONE place. Decoupling MUI -> Tailwind means migrating
// component implementations behind the stable API while these tokens stay put.
module.exports = {
  theme: {
    extend: {
      colors: {
        navy: '#0F2143',
        navy2: '#1B3460',
        ink: '#16223A',
        mute: '#6B7A95',
        line: '#E3E9F2',
        green: '#1FA97A',
        amber: '#E0A33B',
        red: '#D9534F',
        ice: '#CFE0F5',
        surface: '#FFFFFF',
        bg: '#F6F8FB',
      },
      borderRadius: {
        card: '12px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Menlo', 'monospace'],
      },
    },
  },
};
