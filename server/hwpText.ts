import { inflateRawSync } from 'node:zlib';

import * as CFB from 'cfb';

const paragraphTextTag = 67;

function asBuffer(content: Uint8Array | Buffer | number[] | string | undefined) {
  if (!content) throw new Error('HWP 문서 스트림을 찾을 수 없습니다.');
  if (typeof content === 'string') return Buffer.from(content, 'binary');
  return Buffer.isBuffer(content) ? content : Buffer.from(content);
}

function cleanParagraph(value: string) {
  return [...value]
    .map((character) => (character.charCodeAt(0) < 32 ? ' ' : character))
    .join('')
    .replace(/[^\u0020-\u007e\u00a0-\ud7a3]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readParagraphs(section: Buffer) {
  const paragraphs: string[] = [];
  let offset = 0;

  while (offset + 4 <= section.length) {
    const header = section.readUInt32LE(offset);
    offset += 4;
    const tag = header & 0x3ff;
    let size = (header >>> 20) & 0xfff;
    if (size === 0xfff) {
      if (offset + 4 > section.length) break;
      size = section.readUInt32LE(offset);
      offset += 4;
    }
    if (offset + size > section.length) break;

    if (tag === paragraphTextTag) {
      const paragraph = cleanParagraph(section.subarray(offset, offset + size).toString('utf16le'));
      if (paragraph) paragraphs.push(paragraph);
    }
    offset += size;
  }

  return paragraphs;
}

export function extractHwpText(document: Buffer) {
  const container = CFB.read(document, { type: 'buffer' });
  const header = asBuffer(CFB.find(container, 'FileHeader')?.content);
  const compressed = (header.readUInt32LE(36) & 1) === 1;
  const sections = container.FullPaths.filter((path) => /BodyText\/Section\d+$/.test(path)).sort(
    (left, right) => Number(left.match(/\d+$/)?.[0]) - Number(right.match(/\d+$/)?.[0]),
  );

  return sections
    .flatMap((path) => {
      const content = asBuffer(CFB.find(container, path)?.content);
      return readParagraphs(compressed ? inflateRawSync(content) : content);
    })
    .join('\n');
}
