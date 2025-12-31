export function copyText(text: string, fallbackMessage: string): boolean {
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    const success = document.execCommand('copy');
    document.body.removeChild(el);
    if (!success) throw new Error('copy failed');
    return true;
  } catch {
    alert(fallbackMessage);
    // eslint-disable-next-line no-console
    console.warn('[Design Lint] copy failed');
    return false;
  }
}

export async function copyToClipboard(text: string, fallbackMessage: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback to execCommand
    }
  }
  return copyText(text, fallbackMessage);
}
