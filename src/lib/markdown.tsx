import { Fragment, type ReactNode } from 'react';

/**
 * Gemini responses come back as markdown (**bold**, mostly). The UI renders
 * them as plain text, so without this the raw asterisks show up literally.
 * Intentionally handles only **bold** - it's the only marker Gemini actually
 * uses in these responses, and a full markdown renderer is unjustified
 * complexity for that.
 */
export function renderInlineMarkdown(text: string): ReactNode {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, i) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={i}>{segment.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{segment}</Fragment>;
  });
}
