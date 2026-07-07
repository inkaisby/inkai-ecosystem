"use client";

import type { ReactNode } from "react";
import styles from "./PublicMarkdown.module.css";

interface PublicMarkdownProps {
  content: string;
}

const PREVIEW_MAX_LEN = 200;

function isJsonString(str: string): boolean {
  try {
    const trimmed = str.trim();
    return trimmed.startsWith("{") && trimmed.endsWith("}");
  } catch {
    return false;
  }
}

function parseJsonContent(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function getBodyBlocks(content: string): string[] {
  if (isJsonString(content)) return ["JSON Content"];
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
  if (isJsonString(content)) {
    const parsed = parseJsonContent(content);
    if (!parsed) return false;
    // Sejarah, Organisasi, Makna Lambang are typically long and deserve details view
    if (parsed.timeline || parsed.struktur || parsed.simbolMakna) return true;
    if (parsed.teksSambutan && parsed.teksSambutan.length > maxLen) return true;
    return false;
  }
  const blocks = getBodyBlocks(content);
  if (blocks.length === 0) return false;
  if (blocks.length > 1) return true;
  return blockToPlainText(blocks[0]).length > maxLen;
}

export function stripMarkdownTitle(content: string): string {
  if (isJsonString(content)) return content;
  return content.replace(/^#\s+.+\n\n?/, "").trim();
}

export function getContentPreviewText(content: string, maxLen = PREVIEW_MAX_LEN): string {
  if (isJsonString(content)) {
    const parsed = parseJsonContent(content);
    if (!parsed) return "";
    if (parsed.teksSambutan) return parsed.teksSambutan.slice(0, maxLen) + (parsed.teksSambutan.length > maxLen ? "…" : "");
    if (parsed.heroTitle) return `${parsed.heroTitle} - ${parsed.subtitle || ""}`;
    if (parsed.timeline && parsed.timeline[0]) return `${parsed.timeline[0].tahun}: ${parsed.timeline[0].judul} - ${parsed.timeline[0].deskripsi.slice(0, maxLen - 50)}…`;
    if (parsed.simbolMakna && parsed.simbolMakna[0]) return `${parsed.simbolMakna[0].simbol}: ${parsed.simbolMakna[0].makna.slice(0, maxLen - 50)}…`;
    if (parsed.struktur && parsed.struktur[0]) return `Struktur Kepengurusan: ${parsed.struktur.map((s: any) => s.level).join(", ")}`;
    if (parsed.visi) return `Visi: ${parsed.visi.slice(0, maxLen - 10)}…`;
    return "";
  }
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

  // Structured JSON Renderer
  if (isJsonString(content)) {
    const data = parseJsonContent(content);
    if (!data) return <p className="text-red-500 text-xs font-semibold">Gagal memuat konten terstruktur.</p>;

    // 1. HOME SCREEN
    if (data.heroTitle !== undefined) {
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/10 rounded-3xl p-6 space-y-2">
            <h2 className="text-xl font-black text-amber-500 uppercase tracking-wide leading-tight">{data.heroTitle}</h2>
            {data.subtitle && <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{data.subtitle}</p>}
          </div>
          {data.teksSambutan && (
            <div className="p-2">
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{data.teksSambutan}</p>
            </div>
          )}
        </div>
      );
    }

    // 2. TIMELINE SEJARAH
    if (data.timeline !== undefined) {
      return (
        <div className="space-y-6 relative border-l-2 border-amber-500/20 ml-3 pl-6 my-2">
          {data.timeline.map((item: any, idx: number) => (
            <div key={idx} className="relative space-y-1">
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-amber-500 border-4 border-[var(--background-dark)]" />
              <div className="text-xs font-black text-amber-500 uppercase tracking-widest">{item.tahun}</div>
              <h4 className="text-sm font-black text-white uppercase">{item.judul}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">{item.deskripsi}</p>
            </div>
          ))}
        </div>
      );
    }

    // 3. MAKNA LAMBANG
    if (data.simbolMakna !== undefined) {
      return (
        <div className="grid grid-cols-1 gap-4 my-2">
          {data.simbolMakna.map((item: any, idx: number) => (
            <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
              <h4 className="text-sm font-black text-amber-500 uppercase tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {item.simbol}
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed pl-3.5">{item.makna}</p>
            </div>
          ))}
        </div>
      );
    }

    // 4. STRUKTUR ORGANISASI
    if (data.struktur !== undefined) {
      return (
        <div className="space-y-6 my-2">
          {data.struktur.map((levelObj: any, idx: number) => (
            <div key={idx} className="space-y-3">
              <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest border-b border-white/5 pb-1 flex items-center gap-2">
                <span className="w-1.5 h-3 bg-amber-500 rounded-sm" />
                {levelObj.level}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {levelObj.anggota.map((member: any, mIdx: number) => (
                  <div key={mIdx} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0 flex items-center justify-center text-gray-500 overflow-hidden font-black text-xs uppercase">
                      {member.foto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.foto} alt={member.nama} className="w-full h-full object-cover" />
                      ) : (
                        member.nama.slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate uppercase">{member.nama}</h4>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{member.jabatan}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 5. VISI MISI
    if (data.visi !== undefined) {
      return (
        <div className="space-y-6 my-2">
          <div className="p-5 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/10 rounded-3xl space-y-2">
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Visi</h4>
            <p className="text-sm font-semibold text-white leading-relaxed italic">{data.visi}</p>
          </div>
          {data.misi && data.misi.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Misi</h4>
              <div className="space-y-2.5">
                {data.misi.map((misiStr: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-black flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed pt-0.5">{misiStr}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  return <>{renderMarkdown(content)}</>;
}

export function PublicMarkdownPreview({ content }: PublicMarkdownProps) {
  const preview = getContentPreviewText(content);
  if (!preview) return null;
  return <p className={styles.previewText}>{preview}</p>;
}
