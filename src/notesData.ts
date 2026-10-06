export interface Note {
  id: string;
  folder: 'inbox' | 'ap-prep';
  categoryNumber: string;
  categoryName: string;
  filename: string;
  title: string;
  targetExam: string;
  readingTime: string;
  content: string;
}

// Vite eager raw glob import of markdown files under docs/
const mdFiles = import.meta.glob('../docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function loadNotes(): Note[] {
  const notes: Note[] = [];

  for (const [path, rawContent] of Object.entries(mdFiles)) {
    // Expected path pattern: ../docs/(inbox|ap-prep)/XX_カテゴリ名/ファイル名.md
    const match = path.match(/\.\.\/docs\/(inbox|ap-prep)\/([0-9]{2})_([^/]+)\/(.+?\.md)$/);
    if (!match) continue;

    const [, folder, categoryNumber, categoryName, filename] = match;

    // Extract title from first H1 line
    const titleMatch = rawContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : filename.replace(/\.md$/, '');

    // Extract targetExam
    const examMatch = rawContent.match(/>\s*\*\*対象過去問\*\*:\s*([^\n\r]+)/);
    const targetExam = examMatch ? examMatch[1].trim() : '';

    // Extract readingTime
    const timeMatch = rawContent.match(/>\s*\*\*所要時間\*\*:\s*([^\n\r]+)/);
    const readingTime = timeMatch ? timeMatch[1].trim() : '5分';

    notes.push({
      id: `${folder}-${categoryNumber}-${filename}`,
      folder: folder as 'inbox' | 'ap-prep',
      categoryNumber,
      categoryName,
      filename,
      title,
      targetExam,
      readingTime,
      content: rawContent,
    });
  }

  // Sort notes by categoryNumber ascending, then filename
  notes.sort((a, b) => {
    if (a.categoryNumber !== b.categoryNumber) {
      return a.categoryNumber.localeCompare(b.categoryNumber);
    }
    return a.title.localeCompare(b.title);
  });

  return notes;
}
