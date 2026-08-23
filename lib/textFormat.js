/**
 * Ensures a page heading ends with terminal punctuation - a period by
 * default. Applied at render time in each page-heading component, rather
 * than editing every individual headline string across the site - one
 * small utility is far lower-risk than dozens of scattered string edits,
 * and it's consistent by construction rather than by remembering to add
 * a period every time new heading content gets written.
 *
 * Leaves a heading alone if it already ends in ., !, ?, or a closing
 * quote/parenthesis after one of those - so a heading someone
 * deliberately wrote as a question or an exclamation isn't silently
 * turned into a flat statement.
 */
export function withPeriod(text) {
  if (!text) return text;
  const trimmed = text.trim();
  if (/[.!?]["')]?$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}
