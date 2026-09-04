import { useI18n } from './I18nProvider';

/** A language picker driven entirely by the backend's locale list. */
export function LocaleSwitcher() {
  const { locale, locales, setLocale } = useI18n();
  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      aria-label="Language"
      className="rounded-[8px] border border-line bg-white px-2 py-1 text-xs font-semibold text-ink outline-none focus:ring-2 focus:ring-navy/30"
    >
      {locales.map((l) => (
        <option key={l.code} value={l.code}>
          {l.name}
        </option>
      ))}
    </select>
  );
}
