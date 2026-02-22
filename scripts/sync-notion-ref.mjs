#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const NOTION_VERSION = '2022-06-28';
const ROOT_DIR = process.cwd();
const REF_DIR = path.join(ROOT_DIR, '.ref');
const STATE_PATH = path.join(REF_DIR, '.notion-sync-state.json');

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');
const verbose = args.has('--verbose');
const forceSync = args.has('--force');

function log(message) {
  console.log(message);
}

function vLog(message) {
  if (verbose) {
    console.log(message);
  }
}

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadDotEnv() {
  const envPath = path.join(ROOT_DIR, '.env');
  if (!(await fileExists(envPath))) {
    return;
  }

  const raw = await fs.readFile(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex < 0) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function loadState() {
  if (!(await fileExists(STATE_PATH))) {
    return { version: 1, folders: {}, files: {} };
  }

  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      folders: parsed.folders ?? {},
      files: parsed.files ?? {},
    };
  } catch {
    return { version: 1, folders: {}, files: {} };
  }
}

async function saveState(state) {
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

async function walkMarkdownFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }

    const absolute = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkMarkdownFiles(absolute);
      files.push(...nested);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (entry.name.toLowerCase().endsWith('.md')) {
      files.push(absolute);
    }
  }

  files.sort((a, b) => a.localeCompare(b));
  return files;
}

function parseMarkdownToBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];

  let paragraphBuffer = [];
  let quoteBuffer = [];
  let listBuffer = [];
  let numberedListBuffer = [];
  let todoListBuffer = [];
  let codeBuffer = [];
  let inCodeBlock = false;
  let codeLanguage = 'plain text';
  const footnotes = new Map();
  const footnoteOrder = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) {
      return;
    }
    const text = paragraphBuffer.join(' ').trim();
    paragraphBuffer = [];
    if (!text) {
      return;
    }

    for (const chunk of chunkText(text, 1800)) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: richTextFromMarkdown(chunk),
        },
      });
    }
  };

  const flushQuote = () => {
    if (!quoteBuffer.length) {
      return;
    }
    const text = quoteBuffer.join('\n').trim();
    quoteBuffer = [];
    if (!text) {
      return;
    }

    blocks.push({
      object: 'block',
      type: 'quote',
      quote: {
        rich_text: richTextFromMarkdown(text.slice(0, 1900)),
      },
    });
  };

  const flushBullets = () => {
    if (!listBuffer.length) {
      return;
    }

    for (const item of listBuffer) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: richTextFromMarkdown(item.slice(0, 1900)),
        },
      });
    }
    listBuffer = [];
  };

  const flushNumbered = () => {
    if (!numberedListBuffer.length) {
      return;
    }

    for (const item of numberedListBuffer) {
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: richTextFromMarkdown(item.slice(0, 1900)),
        },
      });
    }
    numberedListBuffer = [];
  };

  const flushTodos = () => {
    if (!todoListBuffer.length) {
      return;
    }

    for (const item of todoListBuffer) {
      blocks.push({
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: richTextFromMarkdown(item.text.slice(0, 1900)),
          checked: item.checked,
        },
      });
    }
    todoListBuffer = [];
  };

  const flushCode = () => {
    if (!codeBuffer.length) {
      return;
    }

    const content = codeBuffer.join('\n');
    for (const chunk of chunkText(content, 1800)) {
      blocks.push({
        object: 'block',
        type: 'code',
        code: {
          language: normalizeCodeLanguage(codeLanguage),
          rich_text: [textObject(chunk)],
        },
      });
    }
    codeBuffer = [];
    codeLanguage = 'plain text';
  };

  const flushAll = () => {
    flushParagraph();
    flushQuote();
    flushBullets();
    flushNumbered();
    flushTodos();
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    const footnoteDefMatch = trimmedLine.match(/^\[\^([^\]]+)\]:\s*(.+)$/);
    if (footnoteDefMatch) {
      flushAll();
      const footnoteId = footnoteDefMatch[1].trim();
      const footnoteText = footnoteDefMatch[2].trim();
      if (!footnotes.has(footnoteId)) {
        footnoteOrder.push(footnoteId);
      }
      footnotes.set(footnoteId, footnoteText);
      continue;
    }

    const codeFence = line.match(/^```\s*([\w+-]*)\s*$/);
    if (codeFence) {
      if (!inCodeBlock) {
        flushAll();
        inCodeBlock = true;
        codeLanguage = codeFence[1] || 'plain text';
      } else {
        inCodeBlock = false;
        flushCode();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (trimmedLine === '<details>') {
      flushAll();
      let summary = 'Details';
      const children = [];

      while (index + 1 < lines.length) {
        index += 1;
        const innerLine = lines[index];
        const innerTrimmed = innerLine.trim();

        if (innerTrimmed === '</details>') {
          break;
        }

        const summaryMatch = innerTrimmed.match(/^<summary>(.*)<\/summary>$/);
        if (summaryMatch) {
          summary = summaryMatch[1].trim() || 'Details';
          continue;
        }

        if (!innerTrimmed) {
          continue;
        }

        children.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: richTextFromMarkdown(innerTrimmed.slice(0, 1900)),
          },
        });
      }

      blocks.push({
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: richTextFromMarkdown(summary.slice(0, 1900)),
          children,
        },
      });
      continue;
    }

    if (trimmedLine.includes('|') && index + 1 < lines.length && isLikelyTableSeparator(lines[index + 1])) {
      flushAll();
      const tableRows = [];
      const headerCells = parseTableCells(line);
      tableRows.push(buildTableRow(headerCells));
      index += 1;

      while (index + 1 < lines.length) {
        const nextLine = lines[index + 1];
        if (!nextLine.trim() || !nextLine.includes('|')) {
          break;
        }
        index += 1;
        tableRows.push(buildTableRow(parseTableCells(lines[index])));
      }

      const width = Math.max(1, ...tableRows.map((row) => row.table_row.cells.length));
      for (const row of tableRows) {
        while (row.table_row.cells.length < width) {
          row.table_row.cells.push([textObject('')]);
        }
      }

      blocks.push({
        object: 'block',
        type: 'table',
        table: {
          table_width: width,
          has_column_header: true,
          has_row_header: false,
          children: tableRows,
        },
      });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      flushAll();
      blocks.push({ object: 'block', type: 'divider', divider: {} });
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      const type = `heading_${level}`;
      blocks.push({
        object: 'block',
        type,
        [type]: {
          rich_text: richTextFromMarkdown(headingMatch[2].trim().slice(0, 1900)),
        },
      });
      continue;
    }

    const calloutMatch = line.match(/^>\s*\[!([A-Za-z]+)\]\s*(.*)$/);
    if (calloutMatch) {
      flushAll();
      const level = calloutMatch[1].toUpperCase();
      const message = (calloutMatch[2] || level).trim();
      const icon = calloutIconByLevel(level);
      blocks.push({
        object: 'block',
        type: 'callout',
        callout: {
          rich_text: richTextFromMarkdown(message.slice(0, 1900)),
          icon: { type: 'emoji', emoji: icon },
        },
      });
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushBullets();
      flushNumbered();
      flushTodos();
      quoteBuffer.push(quoteMatch[1]);
      continue;
    }

    const todoMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (todoMatch) {
      flushParagraph();
      flushQuote();
      flushBullets();
      flushNumbered();
      todoListBuffer.push({
        checked: todoMatch[1].toLowerCase() === 'x',
        text: todoMatch[2].trim(),
      });
      continue;
    }

    const bulletMatch = line.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      flushQuote();
      flushNumbered();
      flushTodos();
      listBuffer.push(bulletMatch[1].trim());
      continue;
    }

    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      flushParagraph();
      flushQuote();
      flushBullets();
      flushTodos();
      numberedListBuffer.push(numberedMatch[1].trim());
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  if (inCodeBlock) {
    flushCode();
  }

  flushAll();

  if (footnoteOrder.length) {
    blocks.push({ object: 'block', type: 'divider', divider: {} });
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [textObject('Footnotes')],
      },
    });

    for (const footnoteId of footnoteOrder) {
      const value = footnotes.get(footnoteId) ?? '';
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: richTextFromMarkdown(`[${footnoteId}] ${value}`.slice(0, 1900)),
        },
      });
    }
  }

  return blocks;
}

function isLikelyTableSeparator(line) {
  const cells = parseTableCells(line);
  if (!cells.length) {
    return false;
  }

  return cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function parseTableCells(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  if (!trimmed) {
    return [];
  }
  return trimmed.split('|').map((cell) => cell.trim());
}

function buildTableRow(cells) {
  return {
    object: 'block',
    type: 'table_row',
    table_row: {
      cells: cells.map((cell) => richTextFromMarkdown(cell.slice(0, 1900))),
    },
  };
}

function calloutIconByLevel(level) {
  const icons = {
    NOTE: 'ℹ️',
    INFO: 'ℹ️',
    TIP: '💡',
    IMPORTANT: '❗',
    WARNING: '⚠️',
    CAUTION: '🚫',
  };

  return icons[level] ?? '💬';
}

function chunkText(text, maxLen) {
  if (text.length <= maxLen) {
    return [text];
  }

  const chunks = [];
  let cursor = 0;
  while (cursor < text.length) {
    chunks.push(text.slice(cursor, cursor + maxLen));
    cursor += maxLen;
  }
  return chunks;
}

function textObject(content) {
  return {
    type: 'text',
    text: {
      content,
    },
  };
}

function richTextFromMarkdown(input) {
  const text = String(input || '');
  if (!text) {
    return [textObject('')];
  }

  const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^\)]+\)|\[\^[^\]]+\])/g;
  const result = [];
  let lastIndex = 0;

  const pushPlain = (value) => {
    if (value) {
      result.push(textObject(value));
    }
  };

  let match;
  while ((match = tokenRegex.exec(text)) !== null) {
    const token = match[0];
    const index = match.index;

    if (index > lastIndex) {
      pushPlain(text.slice(lastIndex, index));
    }

    if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      const content = token.slice(2, -2);
      result.push(textObjectWith(content, { bold: true }));
    } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      const content = token.slice(1, -1);
      result.push(textObjectWith(content, { italic: true }));
    } else if (token.startsWith('~~') && token.endsWith('~~')) {
      const content = token.slice(2, -2);
      result.push(textObjectWith(content, { strikethrough: true }));
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const content = token.slice(1, -1);
      result.push(textObjectWith(content, { code: true }));
    } else if (token.startsWith('[')) {
      const footnoteRef = token.match(/^\[\^([^\]]+)\]$/);
      if (footnoteRef) {
        result.push(textObjectWith(`[${footnoteRef[1]}]`, { code: true }));
        lastIndex = index + token.length;
        continue;
      }

      const linkMatch = token.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
      if (linkMatch) {
        result.push(textObjectWith(linkMatch[1], {}, linkMatch[2]));
      } else {
        pushPlain(token);
      }
    } else {
      pushPlain(token);
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    pushPlain(text.slice(lastIndex));
  }

  return result.length ? result : [textObject(text)];
}

function textObjectWith(content, annotations = {}, link = null) {
  const obj = textObject(content);
  if (link) {
    obj.text.link = { url: link };
  }
  if (Object.keys(annotations).length) {
    obj.annotations = {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: 'default',
      ...annotations,
    };
  }
  return obj;
}

function normalizeCodeLanguage(language) {
  const lower = String(language || '').toLowerCase();
  if (!lower) {
    return 'plain text';
  }

  const supported = new Set([
    'plain text', 'javascript', 'typescript', 'python', 'json', 'bash', 'shell', 'markdown', 'html', 'css', 'yaml', 'sql'
  ]);

  if (lower === 'js') return 'javascript';
  if (lower === 'ts') return 'typescript';
  if (lower === 'sh') return 'shell';
  if (lower === 'yml') return 'yaml';

  return supported.has(lower) ? lower : 'plain text';
}

async function notionRequest(token, method, apiPath, body, attempt = 1) {
  const response = await fetch(`https://api.notion.com/v1${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  if ((response.status === 429 || response.status >= 500) && attempt < 5) {
    const backoff = 400 * 2 ** (attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, backoff));
    return notionRequest(token, method, apiPath, body, attempt + 1);
  }

  const errText = await response.text();
  throw new Error(`Notion API ${method} ${apiPath} failed (${response.status}): ${errText}`);
}

async function appendChildren(token, blockId, children) {
  if (!children.length) {
    return;
  }

  const chunkSize = 100;
  for (let index = 0; index < children.length; index += chunkSize) {
    const batch = children.slice(index, index + chunkSize);
    await notionRequest(token, 'PATCH', `/blocks/${blockId}/children`, { children: batch });
  }
}

async function listChildren(token, blockId) {
  const collected = [];
  let startCursor = undefined;

  while (true) {
    const params = new URLSearchParams({ page_size: '100' });
    if (startCursor) {
      params.set('start_cursor', startCursor);
    }

    const data = await notionRequest(token, 'GET', `/blocks/${blockId}/children?${params.toString()}`);
    collected.push(...(data.results ?? []));

    if (!data.has_more) {
      break;
    }
    startCursor = data.next_cursor;
  }

  return collected;
}

async function archiveAllChildren(token, pageId) {
  const children = await listChildren(token, pageId);
  for (const child of children) {
    await notionRequest(token, 'PATCH', `/blocks/${child.id}`, { archived: true });
  }
}

async function createChildPage(token, parentPageId, title) {
  const payload = {
    parent: { page_id: parentPageId },
    properties: {
      title: {
        title: [textObject(title)],
      },
    },
  };
  return notionRequest(token, 'POST', '/pages', payload);
}

async function updatePageTitle(token, pageId, title) {
  const payload = {
    properties: {
      title: {
        title: [textObject(title)],
      },
    },
  };
  await notionRequest(token, 'PATCH', `/pages/${pageId}`, payload);
}

function getFileTitle(relativePath) {
  return path.basename(relativePath, '.md');
}

async function ensureFolderPage({ token, state, folderPath, rootPageId }) {
  if (!folderPath || folderPath === '.') {
    return rootPageId;
  }

  const segments = folderPath.split('/').filter(Boolean);
  let parentId = rootPageId;
  let accumulated = '';

  for (const segment of segments) {
    accumulated = accumulated ? `${accumulated}/${segment}` : segment;
    const cachedId = state.folders[accumulated];
    if (cachedId) {
      parentId = cachedId;
      continue;
    }

    const page = await createChildPage(token, parentId, segment);
    state.folders[accumulated] = page.id;
    parentId = page.id;
    vLog(`created folder page: ${accumulated}`);
  }

  return parentId;
}

async function syncOneFile({ token, state, absolutePath, relativePath, rootPageId, stats }) {
  const markdown = await fs.readFile(absolutePath, 'utf8');
  const hash = sha256(markdown);
  const previous = state.files[relativePath];

  if (!forceSync && previous?.hash === hash) {
    stats.skipped += 1;
    vLog(`skip unchanged: ${relativePath}`);
    return;
  }

  const folderPath = path.posix.dirname(relativePath) === '.' ? '' : path.posix.dirname(relativePath);
  const fileTitle = getFileTitle(relativePath);

  if (isDryRun) {
    if (previous?.notionPageId) {
      stats.wouldUpdate += 1;
      log(`[dry-run] update ${relativePath}`);
    } else {
      stats.wouldCreate += 1;
      log(`[dry-run] create ${relativePath}`);
    }
    return;
  }

  const parentId = await ensureFolderPage({ token, state, folderPath, rootPageId });

  let notionPageId = previous?.notionPageId;
  if (!notionPageId) {
    const page = await createChildPage(token, parentId, fileTitle);
    notionPageId = page.id;
    stats.created += 1;
    vLog(`created page: ${relativePath}`);
  } else {
    await updatePageTitle(token, notionPageId, fileTitle);
    stats.updated += 1;
    vLog(`updating page: ${relativePath}`);
  }

  const blocks = parseMarkdownToBlocks(markdown);
  await archiveAllChildren(token, notionPageId);
  await appendChildren(token, notionPageId, blocks);

  state.files[relativePath] = {
    hash,
    notionPageId,
    lastSyncedAt: new Date().toISOString(),
  };
}

async function main() {
  await loadDotEnv();

  if (!(await fileExists(REF_DIR))) {
    throw new Error(`.ref directory not found: ${REF_DIR}`);
  }

  const markdownFiles = await walkMarkdownFiles(REF_DIR);
  if (!markdownFiles.length) {
    log('No markdown files found in .ref');
    return;
  }

  const state = await loadState();
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    wouldCreate: 0,
    wouldUpdate: 0,
    failed: 0,
  };

  const token = process.env.NOTION_TOKEN;
  const rootPageId = process.env.NOTION_ROOT_PAGE_ID;

  if (!isDryRun && (!token || !rootPageId)) {
    throw new Error('NOTION_TOKEN and NOTION_ROOT_PAGE_ID are required for non-dry-run mode.');
  }

  if (isDryRun) {
    log(`Dry-run mode: scanning ${markdownFiles.length} markdown files from .ref`);
  }

  for (const absolutePath of markdownFiles) {
    const relativePath = toPosixPath(path.relative(REF_DIR, absolutePath));

    try {
      await syncOneFile({
        token,
        state,
        absolutePath,
        relativePath,
        rootPageId,
        stats,
      });
    } catch (error) {
      stats.failed += 1;
      console.error(`failed: ${relativePath}`);
      console.error(error instanceof Error ? error.message : String(error));
    }
  }

  if (!isDryRun) {
    await saveState(state);
  }

  log('--- sync summary ---');
  if (isDryRun) {
    log(`would create: ${stats.wouldCreate}`);
    log(`would update: ${stats.wouldUpdate}`);
  } else {
    log(`created: ${stats.created}`);
    log(`updated: ${stats.updated}`);
  }
  log(`skipped: ${stats.skipped}`);
  log(`failed: ${stats.failed}`);

  if (stats.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
