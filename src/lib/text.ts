// Copy files may use **bold**. Nothing else is interpreted.
const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
export const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
export const plain = (s: string) => s.replace(/\*\*/g, '');
// A blank line in a content field is a paragraph break. Everything else is one paragraph.
export const paras = (s: string) => s.trim().split(/\n\s*\n/).map((p) => `<p>${inline(p.trim())}</p>`).join('');
