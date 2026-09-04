import { Select } from '@atlas/core';
import { useI18n, useT } from './I18nProvider';

/** A language picker driven entirely by the backend's locale list. */
export function LocaleSwitcher() {
  const { locale, locales, setLocale } = useI18n();
  const translate = useT();
  const options = locales.map((localeInfo) => ({ value: localeInfo.code, label: localeInfo.name }));
  return (
    <Select
      value={locale}
      options={options}
      onChange={setLocale}
      size="small"
      aria-label={translate('header.language', 'Language')}
      fullWidth={false}
      sx={{ minWidth: 140 }}
    />
  );
}
