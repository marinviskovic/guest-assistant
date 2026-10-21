import { Fragment, type ReactNode } from "react";

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;

/** The assistant writes plain text with "- " lists; turn that into paragraphs and lists, nothing more. */
export function RichText({ text }: { text: string }) {
  const lines = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flush = () => {
    if (paragraph.length) {
      blocks.push(
        <p key={blocks.length} className="my-2 first:mt-0 last:mb-0">
          {paragraph.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </p>,
      );
    }
    if (list.length) {
      blocks.push(
        <ul key={blocks.length} className="my-2 list-disc space-y-1 pl-5 first:mt-0 last:mb-0 marker:text-sea/60">
          {list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>,
      );
    }
    paragraph = [];
    list = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      flush();
    } else if (BULLET.test(line)) {
      if (paragraph.length) flush();
      list.push(line.replace(BULLET, ""));
    } else {
      if (list.length) flush();
      paragraph.push(line.trim());
    }
  }
  flush();
  return <>{blocks}</>;
}
