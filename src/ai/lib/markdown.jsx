// Hand-rolled, minimal markdown renderer (PLAN.md §7 item 16 / §4.2 item 7): bold, italic,
// inline code, lists, links. Never uses dangerouslySetInnerHTML — all output is React elements
// or plain text nodes, so React's default escaping stays intact and no raw HTML can execute.
// Only /product/... and /company/... links become router <Link>s; every other URL renders as
// plain text (label + URL), never as a clickable anchor.
import { Link } from "react-router-dom";

const INLINE_RE = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))|(\*([^*]+)\*)/g;

function isInternalPath(url) {
  return typeof url === "string" && /^\/(?:product|company)\/[^\s/]+\/?$/.test(url);
}

function renderInline(text, keyPrefix) {
  const nodes = [];
  let lastIndex = 0;
  let match;
  let idx = 0;
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const key = `${keyPrefix}-${idx++}`;

    if (match[1]) {
      nodes.push(<strong key={key}>{match[2]}</strong>);
    } else if (match[3]) {
      nodes.push(
        <code key={key} className="px-1 py-0.5 rounded bg-ink-100 dark:bg-[#1C1C1C] text-[0.9em]">
          {match[4]}
        </code>
      );
    } else if (match[5]) {
      const label = match[6];
      const url = match[7];
      if (isInternalPath(url)) {
        nodes.push(
          <Link
            key={key}
            to={url}
            className="text-brand-600 dark:text-brand-400 underline underline-offset-2"
          >
            {label}
          </Link>
        );
      } else {
        nodes.push(`${label} (${url})`);
      }
    } else if (match[8]) {
      nodes.push(<em key={key}>{match[9]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function toBlocks(content) {
  const lines = content.split(/\r?\n/);
  const blocks = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "p", lines: paragraph });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }
    const ulMatch = /^[-*]\s+(.*)$/.exec(line);
    const olMatch = /^\d+\.\s+(.*)$/.exec(line);
    if (ulMatch) {
      flushParagraph();
      if (!list || list.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(ulMatch[1]);
    } else if (olMatch) {
      flushParagraph();
      if (!list || list.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(olMatch[1]);
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

export default function Markdown({ text }) {
  if (!text) return null;
  const blocks = toBlocks(text);

  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        if (block.type === "p") {
          return (
            <p key={bi} className="whitespace-pre-wrap break-words">
              {block.lines.map((line, li) => (
                <span key={li}>
                  {renderInline(line, `${bi}-${li}`)}
                  {li < block.lines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          );
        }
        const Tag = block.type === "ul" ? "ul" : "ol";
        return (
          <Tag
            key={bi}
            className={block.type === "ul" ? "list-disc pl-5 space-y-1" : "list-decimal pl-5 space-y-1"}
          >
            {block.items.map((item, ii) => (
              <li key={ii}>{renderInline(item, `${bi}-${ii}`)}</li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}
