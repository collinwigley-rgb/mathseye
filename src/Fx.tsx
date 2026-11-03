import type { ReactNode } from 'react';

const RE = /(?<![\d./])(\d+)\/(\d+)(?![\d/.])/g;

/** Shows n/d as a stacked fraction (numerator over denominator). */
export function Fx({ text }: { text: string }): ReactNode {
  const out: ReactNode[] = [];
  let last = 0, k = 0, m: RegExpExecArray | null;
  RE.lastIndex = 0;
  while ((m = RE.exec(text))) {
    out.push(text.slice(last, m.index));
    out.push(<span key={k++} className="frac" aria-label={`${m[1]} over ${m[2]}`}><span>{m[1]}</span><span>{m[2]}</span></span>);
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}
