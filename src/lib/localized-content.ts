import i18n from '@/i18n';

/**
 * Map i18n language code to API field suffix for multilingual content.
 * Backend uses: title, titleAm, titleOm, titleGz
 */
const langToField: Record<string, 'title' | 'titleAm' | 'titleOm' | 'titleGz'> = {
  en: 'title',
  am: 'titleAm',
  om: 'titleOm',
  gez: 'titleGz',
};

export type LocalizedTitle = {
  title?: string | null;
  titleAm?: string | null;
  titleOm?: string | null;
  titleGz?: string | null;
};

/**
 * Returns the best available title for the current locale, falling back to default title then others.
 */
export function getLocalizedTitle(item: LocalizedTitle | null | undefined): string {
  if (!item) return '';
  const lang = i18n.language?.split('-')[0] || 'en';
  const field = langToField[lang] || 'title';
  const value = item[field];
  if (value != null && String(value).trim()) return String(value).trim();
  if (item.title != null && String(item.title).trim()) return String(item.title).trim();
  return (
    item.titleAm ||
    item.titleOm ||
    item.titleGz ||
    item.title ||
    ''
  ).trim() || '';
}

export type LocalizedDescription = {
  description?: string | null;
  descriptionAm?: string | null;
  descriptionOm?: string | null;
  descriptionGz?: string | null;
};

const langToDescField: Record<string, 'description' | 'descriptionAm' | 'descriptionOm' | 'descriptionGz'> = {
  en: 'description',
  am: 'descriptionAm',
  om: 'descriptionOm',
  gez: 'descriptionGz',
};

export function getLocalizedDescription(item: LocalizedDescription | null | undefined): string {
  if (!item) return '';
  const lang = i18n.language?.split('-')[0] || 'en';
  const field = langToDescField[lang] || 'description';
  const value = item[field];
  if (value != null && String(value).trim()) return String(value).trim();
  if (item.description != null && String(item.description).trim()) return String(item.description).trim();
  return (
    item.descriptionAm ||
    item.descriptionOm ||
    item.descriptionGz ||
    item.description ||
    ''
  ).trim() || '';
}
