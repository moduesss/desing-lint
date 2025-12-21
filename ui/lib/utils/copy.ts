export function copyText(text: string, fallbackMessage: string) {
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  } catch {
    alert(fallbackMessage);
    // eslint-disable-next-line no-console
    console.warn('[Design Lint] copy failed');
  }
}
