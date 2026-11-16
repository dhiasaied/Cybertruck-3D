/**
 * Accessible split text: the full string stays available to screen readers,
 * while words → chars are wrapped in masked spans for staggered reveals.
 * Animate `.split__char` (inside `.split__word` masks) with GSAP.
 */
export default function SplitText({ as: Tag = 'span', text, className = '', by = 'chars', ...props }) {
  const lines = text.split('\n')
  return (
    <Tag className={`split ${className}`} aria-label={text.replace(/\n/g, ' ')} {...props}>
      {lines.map((line, li) => (
        <span className="split__line" aria-hidden="true" key={li}>
          {line.split(' ').map((word, wi) => (
            <span className="split__word" key={wi}>
              {by === 'words' ? (
                <span className="split__char">{word}</span>
              ) : (
                word.split('').map((c, ci) => (
                  <span className="split__char" key={ci}>
                    {c}
                  </span>
                ))
              )}
              {wi < line.split(' ').length - 1 ? ' ' : ''}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  )
}
