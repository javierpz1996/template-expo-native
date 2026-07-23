/** Reemplaza {{clave}} en textos i18n cuando la interpolación nativa falla. */
export function formatI18nTemplate(
  template: string,
  params?: Record<string, string | number> | null,
): string {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((text, [key, value]) => {
    return text.split(`{{${key}}}`).join(String(value));
  }, template);
}
