// Copy files may use **bold**. Nothing else is interpreted.
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
export const plain = (s: string) => s.replace(/\*\*/g, '');
// A blank line in a content field is a paragraph break. Everything else is one paragraph.
export const paras = (s: string) => s.trim().split(/\n\s*\n/).map((p) => `<p>${inline(p.trim())}</p>`).join('');

// Pitch pages: *word* is the serif italic accent, **word** is ink. Headings and body alike.
export const rich = (s: string) => inline(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
// Fine print that points at this site's own pages: [Terms](/terms). Only site paths, so copy can't link out.
export const linked = (s: string) => rich(s).replace(/\[(.+?)\]\((\/[a-z0-9/-]*)\)/g, '<a href="$2">$1</a>');
export const richParas = (s: string) => s.trim().split(/\n\s*\n/).map((p) => `<p>${rich(p.trim())}</p>`).join('');
export const bare = (s: string) => s.replace(/\*+/g, '');

// {slots} and {days} in a pitch's copy come from its offer, so a changed term changes every page that says it.
// An unknown token, or one the offer leaves empty, fails the build.
export function fill<T>(data: T, vars: Record<string, string | number | null>, where: string): T {
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') {
      return v.replace(/\{([a-z_]+)\}/g, (_, k: string) => {
        const got = vars[k];
        if (got === undefined || got === null) throw new Error(`${where}: {${k}} has no value from the offer`);
        return String(got);
      });
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(data) as T;
}
