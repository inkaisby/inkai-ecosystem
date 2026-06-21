"use client";

import type { ReactNode } from "react";
import styles from "./PublicMarkdown.module.css";

interface PublicMarkdownProps {
  content: string;
}

const PREVIEW_MAX_LEN = 200;

function getBodyBlocks(content: string): string[] {
  return content
    .split("\n\n")
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith("# "));
}

function blockToPlainText(block: string): string {
  return block
    .replace(/^###\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^-\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();
}

/** Tampilkan "Baca Selengkapnya" hanya jika konten panjang atau punya banyak blok. */
export function shouldShowReadMore(content: string, maxLen = PREVIEW_MAX_LEN): boolean {
  const blocks = getBodyBlocks(content);
  if (blocks.length === 0) return false;
  if (blocks.length > 1) return true;
  return blockToPlainText(blocks[0]).length > maxLen;
}

export function stripMarkdownTitle(content: string): string {
  return content.replace(/^#\s+.+\n\n?/, "").trim();
}

export function getContentPreviewText(content: string, maxLen = PREVIEW_MAX_LEN): string {
  const blocks = getBodyBlocks(content);
  if (blocks.length === 0) return "";

  let collected = "";
  for (const block of blocks) {
    const text = blockToPlainText(block);
    if (!text) continue;
    if (collected.length + text.length + 1 <= maxLen) {
      collected = collected ? `${collected} ${text}` : text;
    } else {
      const remaining = maxLen - collected.length - (collected ? 1 : 0);
      if (remaining > 0) {
        collected = collected
          ? `${collected} ${text.slice(0, remaining).trim()}…`
          : `${text.slice(0, maxLen).trim()}…`;
      } else if (!collected) {
        collected = `${text.slice(0, maxLen).trim()}…`;
      } else {
        collected = `${collected}…`;
      }
      break;
    }
  }

  if (blocks.length > 1 && collected && !collected.endsWith("…")) {
    collected = `${collected}…`;
  }

  return collected;
}

export default function PublicMarkdown({ content }: PublicMarkdownProps) {
  const renderInlineBold = (raw: string) =>
    raw.split("**").map((part, pIdx) =>
      pIdx % 2 === 1 ? (
        <strong key={pIdx} className={styles.mdStrong}>
          {part}
        </strong>
      ) : (
        part
      )
    );

  const pickListIcon = (cleanLine: string, context: string) => {
    const lower = cleanLine.toLowerCase();
    if (context.includes("pengumuman")) {
      if (lower.includes("ujian") || lower.includes("jadwal") || lower.includes("wilayah")) return "📅";
      if (lower.includes("rakernas") || lower.includes("rapat")) return "🏢";
      return "📢";
    }
    if (context.includes("prestasi")) {
      if (lower.includes("juara") || lower.includes("piala") || lower.includes("emas")) return "🏆";
      return "🏅";
    }
    return "•";
  };

  const renderListBlock = (lines: string[], blockIndex: number, context: string) => {
    const isRich =
      context.toLowerCase().includes("pengumuman") ||
      context.toLowerCase().includes("prestasi");

    return (
      <div key={`list-${blockIndex}`} className={styles.mdList}>
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^- /, "");
          const icon = isRich ? pickListIcon(cleanLine, context.toLowerCase()) : "•";

          return (
            <div key={idx} className={styles.mdListItem}>
              {isRich ? (
                <span className={styles.mdListIcon}>{icon}</span>
              ) : (
                <span className={styles.mdListBullet} />
              )}
              <div className={styles.mdListText}>{renderInlineBold(cleanLine)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderNumberedBlock = (lines: string[], blockIndex: number) => (
    <div key={`num-${blockIndex}`} className={styles.mdList}>
      {lines.map((line, idx) => {
        const match = line.match(/^(\d+)\.\s*(.*)/);
        if (!match) return null;
        const [, num, body] = match;

        return (
          <div key={idx} className={styles.mdListItem}>
            <span className={styles.mdNumber}>{num}</span>
            <div className={styles.mdListText}>{renderInlineBold(body)}</div>
          </div>
        );
      })}
    </div>
  );

  const renderMarkdown = (text: string): ReactNode[] => {
    const blocks = text.split("\n\n");

    return blocks.flatMap((block, blockIndex) => {
      const lines = block.split("\n").filter((line) => line.trim() !== "");
      if (lines.length === 0) return [];

      if (lines[0].startsWith("# ")) {
        return [
          <h2 key={`h2-${blockIndex}`} className={styles.mdH2}>
            {lines[0].replace("# ", "")}
          </h2>,
          ...renderMarkdown(lines.slice(1).join("\n\n")),
        ];
      }

      if (lines[0].startsWith("### ")) {
        const heading = lines[0].replace("### ", "");
        const rest = lines.slice(1).join("\n\n");
        return [
          <h3 key={`h3-${blockIndex}`} className={styles.mdH3}>
            <span className={styles.mdH3Bar} />
            {heading}
          </h3>,
          ...(rest ? renderMarkdown(rest) : []),
        ];
      }

      if (lines.every((line) => line.startsWith("- "))) {
        return [renderListBlock(lines, blockIndex, text)];
      }

      if (lines.some((line) => /^\d+\.\s/.test(line))) {
        return [renderNumberedBlock(lines, blockIndex)];
      }

      return [
        <p key={`p-${blockIndex}`} className={styles.mdP}>
          {block.split("**").map((part, pIdx) =>
            pIdx % 2 === 1 ? (
              <strong key={pIdx} className={styles.mdStrong}>
                {part}
              </strong>
            ) : (
              part
            )
          )}
        </p>,
      ];
    });
  };

  return <>{renderMarkdown(content)}</>;
}

export function PublicMarkdownPreview({ content }: PublicMarkdownProps) {
  const preview = getContentPreviewText(content);
  if (!preview) return null;
  return <p className={styles.previewText}>{preview}</p>;
}
