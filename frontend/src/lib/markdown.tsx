import { Fragment, type ReactNode } from "react";

/**
 * Mini-renderer markdown (sans dépendance, sans HTML brut) pour l'analyse de Pixtral :
 * titres, paragraphes, listes sur deux niveaux, **gras**, *italique*, `code`, liens.
 * Le backend échappe les « $ » des prix (`\$`) : on les rétablit.
 */

function inline(text: string, keyPrefix = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<>"')]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}${k++}`;
    const md = /^\[([^\]]+)\]\((.+)\)$/.exec(tok);
    if (md) {
      out.push(
        <a key={key} href={md[2]} target="_blank" rel="noreferrer">
          {md[1]}
        </a>,
      );
    } else if (tok.startsWith("http")) {
      out.push(
        <a key={key} href={tok} target="_blank" rel="noreferrer">
          {tok.replace(/^https?:\/\/(www\.)?/, "")}
        </a>,
      );
    } else if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    else out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Item = { text: string; children: string[] };

const TOP_ITEM = /^\s{0,1}(\d+[.)]|[-*•])\s+(.*)$/;
const SUB_ITEM = /^\s{2,}(?:\d+[.)]|[-*•])\s+(.*)$/;
const HEADING = /^(#{1,4})\s+(.*)$/;

export function renderMarkdown(src: string): ReactNode {
  const lines = (src || "").replace(/\r/g, "").replace(/\\\$/g, "$").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push(<hr key={key++} />);
      i++;
      continue;
    }

    const h = HEADING.exec(line);
    if (h) {
      const Tag = `h${Math.min(h[1].length + 1, 4)}` as "h2" | "h3" | "h4";
      blocks.push(<Tag key={key++}>{inline(h[2].replace(/#+\s*$/, ""))}</Tag>);
      i++;
      continue;
    }

    const top = TOP_ITEM.exec(line);
    if (top) {
      const ordered = /^\d/.test(top[1]);
      const items: Item[] = [];
      while (i < lines.length) {
        const l = lines[i];
        const t = TOP_ITEM.exec(l);
        const s = SUB_ITEM.exec(l);
        if (t && /^\d/.test(t[1]) === ordered) items.push({ text: t[2], children: [] });
        else if (s && items.length) items[items.length - 1].children.push(s[1]);
        else if (/^\s{2,}\S/.test(l) && items.length) {
          // ligne de continuation indentée : on la rattache au dernier élément
          const it = items[items.length - 1];
          if (it.children.length) it.children[it.children.length - 1] += " " + l.trim();
          else it.text += " " + l.trim();
        } else if (!l.trim() && i + 1 < lines.length) {
          // ligne vide : la liste continue si la ligne suivante en fait encore partie
          const next = TOP_ITEM.exec(lines[i + 1]);
          const continues = (next && /^\d/.test(next[1]) === ordered) || (SUB_ITEM.test(lines[i + 1]) && items.length > 0);
          if (!continues) break;
        } else break;
        i++;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={key++}>
          {items.map((it, ii) => (
            <li key={ii}>
              {inline(it.text, `l${ii}`)}
              {it.children.length ? (
                <ul>
                  {it.children.map((c, ci) => (
                    <li key={ci}>{inline(c, `l${ii}c${ci}`)}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </List>,
      );
      continue;
    }

    // paragraphe : on agrège jusqu'à la prochaine ligne vide / bloc
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !HEADING.test(lines[i]) && !TOP_ITEM.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++}>
        {para.map((l, li) => (
          <Fragment key={li}>
            {li > 0 ? <br /> : null}
            {inline(l.trim(), `p${li}`)}
          </Fragment>
        ))}
      </p>,
    );
  }

  return <>{blocks}</>;
}
