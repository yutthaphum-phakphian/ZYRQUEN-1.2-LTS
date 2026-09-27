import type { KnowledgeChunk } from "./types";

const MAX_CHUNK_CHARS = 1400;

interface ChunkRange {
  content: string;
  startOffset: number;
  endOffset: number;
}

function boundedChunks(content: string, maxChars = MAX_CHUNK_CHARS): ChunkRange[] {
  const ranges: ChunkRange[] = [];
  for (let start = 0; start < content.length; start += maxChars) {
    const end = Math.min(content.length, start + maxChars);
    ranges.push({ content: content.slice(start, end), startOffset: start, endOffset: end });
  }
  return ranges;
}

function headingChunks(content: string): ChunkRange[] {
  const headings = Array.from(content.matchAll(/^(#{1,6})\s+.+$/gm));
  if (!headings.length) return boundedChunks(content);
  return headings.map((heading, index) => {
    const start = heading.index ?? 0;
    const end = headings[index + 1]?.index ?? content.length;
    const section = content.slice(start, end);
    return section.length <= MAX_CHUNK_CHARS
      ? { content: section, startOffset: start, endOffset: end }
      : boundedChunks(section, MAX_CHUNK_CHARS).map(range => ({
          content: range.content,
          startOffset: start + range.startOffset,
          endOffset: start + range.endOffset,
        }))[0];
  });
}

function declarationChunks(content: string): ChunkRange[] {
  const declarations = Array.from(
    content.matchAll(
      /^(?:(?:export|default|public|private|protected|async|declare|abstract|static)\s+)*(?:function|class|interface|type|enum|const|let|var)\b/gm
    )
  );
  if (!declarations.length) return boundedChunks(content);
  const ranges = declarations.map((match, index) => {
    const start = match.index ?? 0;
    const end = declarations[index + 1]?.index ?? content.length;
    return { content: content.slice(start, end), startOffset: start, endOffset: end };
  });
  const prefix = content.slice(0, ranges[0].startOffset).trim();
  if (prefix) ranges.unshift({ content: prefix, startOffset: 0, endOffset: ranges[0].startOffset });
  return ranges.flatMap(range =>
    range.content.length <= MAX_CHUNK_CHARS
      ? [range]
      : boundedChunks(range.content, MAX_CHUNK_CHARS).map(chunk => ({
          content: chunk.content,
          startOffset: range.startOffset + chunk.startOffset,
          endOffset: range.startOffset + chunk.endOffset,
        }))
  );
}

function lineForOffset(content: string, offset: number): number {
  return content.slice(0, offset).split("\n").length;
}

export function chunkContent(path: string, content: string): KnowledgeChunk[] {
  const extension = path.slice(path.lastIndexOf(".")).toLowerCase();
  const ranges = extension === ".md" ? headingChunks(content) :
    [".ts", ".tsx", ".js", ".jsx"].includes(extension)
      ? declarationChunks(content)
      : boundedChunks(content);
  return ranges
    .filter(range => range.content.trim().length > 0)
    .map((range, sequence) => ({
      id: `${sequence}:${range.startOffset}:${range.endOffset}`,
      documentId: "",
      sequence,
      content: range.content,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      startLine: lineForOffset(content, range.startOffset),
      endLine: lineForOffset(content, Math.max(range.startOffset, range.endOffset - 1)),
    }));
}
