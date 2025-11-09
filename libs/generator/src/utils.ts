import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

export const ensureDirectory = (targetPath: string): void => {
  const dir = dirname(targetPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

export const pascalCase = (value: string): string => {
  return value
    .replace(/[_\-\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
};

export const camelCase = (value: string): string => {
  const pascal = pascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

export const kebabCase = (value: string): string => {
  return value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
};

export const singularize = (value: string): string => {
  if (value.endsWith('ies')) {
    return value.slice(0, -3) + 'y';
  }
  if (value.endsWith('ses')) {
    return value.slice(0, -2);
  }
  if (value.endsWith('s') && value.length > 1) {
    return value.slice(0, -1);
  }
  return value;
};

export const readIfExists = (path: string): string | null => {
  if (!existsSync(path)) {
    return null;
  }
  return readFileSync(path, 'utf8');
};

export const writeFileSafely = (path: string, content: string): void => {
  ensureDirectory(path);
  writeFileSync(path, content, 'utf8');
};

export const mergeWithPreservedSections = (generated: string, existing?: string | null): string => {
  if (!existing) {
    return generated;
  }

  const preservePattern = /\/\/ <generator-preserve ([^>]+)>([\s\S]*?)\/\/ <\/generator-preserve \1>/g;
  const existingSections = new Map<string, string>();

  let match: RegExpExecArray | null;
  while ((match = preservePattern.exec(existing))) {
    const [, id, body] = match;
    existingSections.set(id, body.trimStart().replace(/\s+$/, '\n'));
  }

  return generated.replace(preservePattern, (segment, id: string) => {
    const preserved = existingSections.get(id);
    if (!preserved) {
      return segment;
    }
    return `// <generator-preserve ${id}>\n${preserved.trimEnd()}\n// </generator-preserve ${id}>`;
  });
};

export const normalizeWhitespace = (value: string): string => value.replace(/\r\n/g, '\n').trim() + '\n';
