import { extname, basename, relative, dirname, join } from 'path';
import type { NormalizedPluginOptions, ParsedIndex, ParsedPage, PluginOptions } from './types';
import slugify from 'slugify';
import type { PageAttributes } from '@builder.io/qwest';

export function getPagePathname(opts: NormalizedPluginOptions, filePath: string) {
  let pathname = toPosix(relative(opts.pagesDir, filePath));

  const fileName = getBasename(pathname);
  const dirName = toPosix(dirname(pathname));
  if (fileName === 'index') {
    if (dirName === '.') {
      return '/';
    } else {
      throw new Error(
        `Subdirectories cannot have an index file: "${filePath}". Please rename the file to something like "overview.mdx" or "introduction.md".`
      );
    }
  } else {
    pathname = `/${dirName}/${fileName}`;
  }

  pathname = pathname
    .trim()
    .toLocaleLowerCase()
    .replace(/ /g, '-')
    .replace(/_/g, '-')
    .split('/')
    .map((p) => slugify(p))
    .join('/');

  const url = new URL(pathname, 'http://normalize.me/');
  pathname = url.pathname
    .split('/')
    .map((p) => slugify(p))
    .join('/');
  if (opts.trailingSlash && !pathname.endsWith('/')) {
    pathname += '/';
  }
  return pathname;
}

export function getIndexPathname(opts: NormalizedPluginOptions, filePath: string) {
  let pathname = toPosix(relative(opts.pagesDir, filePath));
  pathname = `/${toPosix(dirname(pathname))}`;
  return normalizePathname(opts, pathname);
}

export function getIndexLinkHref(
  opts: NormalizedPluginOptions,
  indexFilePath: string,
  href: string
) {
  const prefix = href.toLocaleLowerCase();
  if (
    prefix.startsWith('/') ||
    prefix.startsWith('https:') ||
    prefix.startsWith('http:') ||
    prefix.startsWith('file:')
  ) {
    return href;
  }

  const querySplit = href.split('?');
  const hashSplit = href.split('#');
  href = href.split('?')[0].split('#')[0];

  const suffix = href.toLocaleLowerCase();
  if (!suffix.endsWith('.mdx') && !suffix.endsWith('.md')) {
    return href;
  }

  const indexDir = dirname(indexFilePath);
  const parts = toPosix(href)
    .split('/')
    .filter((p) => p.length > 0);
  const filePath = join(indexDir, ...parts);

  let pathname = getPagePathname(opts, filePath);
  if (querySplit.length > 1) {
    pathname += '?' + querySplit[1];
  } else if (hashSplit.length > 1) {
    pathname += '#' + hashSplit[1];
  }
  return pathname;
}

function normalizePathname(opts: NormalizedPluginOptions, pathname: string) {
  pathname = pathname
    .trim()
    .toLocaleLowerCase()
    .replace(/ /g, '-')
    .replace(/_/g, '-')
    .split('/')
    .map((p) => slugify(p))
    .join('/');

  const url = new URL(pathname, 'http://normalize.me/');
  pathname = url.pathname;

  if (opts.trailingSlash && !pathname.endsWith('/')) {
    pathname += '/';
  }
  return pathname;
}

export function getPageTitle(filePath: string, attrs: PageAttributes) {
  let title = '';
  if (typeof attrs.title === 'string') {
    title = attrs.title!.trim();
  }
  if (title === '') {
    title = getBasename(filePath);
    title = toTitleCase(title.replace(/-/g, ' '));
  }
  return title.trim();
}

export function validateLayout(
  opts: NormalizedPluginOptions,
  filePath: string,
  attrs: PageAttributes
) {
  if (opts && opts.layouts != null) {
    if (typeof attrs.layout === 'string' && attrs.layout !== 'default') {
      if (!opts.layouts[attrs.layout as any]) {
        throw new Error(`Invalid layout "${attrs.layout}" in ${filePath}`);
      }
    }
  }
}

function getBasename(filePath: string) {
  if (filePath.endsWith('.md')) {
    return basename(filePath, '.md');
  }
  if (filePath.endsWith('.mdx')) {
    return basename(filePath, '.mdx');
  }
  return basename(filePath);
}

function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (txt: string) {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
}

function toPosix(p: string) {
  return p.replace(/\\/g, '/');
}

export function normalizeOptions(userOpts: PluginOptions) {
  userOpts = { ...userOpts };
  const extensions = (Array.isArray(userOpts.extensions) ? userOpts.extensions : ['.md', '.mdx'])
    .filter((ext) => typeof ext === 'string')
    .map((ext) => ext.toLowerCase().trim());
  const opts: NormalizedPluginOptions = { ...userOpts, extensions };
  return opts;
}

export function isMarkdownFile(opts: NormalizedPluginOptions, filePath: string) {
  const ext = extname(filePath).toLowerCase();
  return opts.extensions.includes(ext);
}

export function isReadmeFile(filePath: string) {
  filePath = filePath.toLowerCase();
  return filePath === 'readme.md' || filePath === 'readme';
}

export function getPagesBuildPath(page: ParsedPage) {
  let pathname = page.pathname;
  if (pathname === '/') {
    pathname += 'index';
  }
  return `pages${pathname}.js`;
}

export function getIndexBuildPath(index: ParsedIndex) {
  return `pages${index.href}/index.json`;
}

/** Known file extension we know are not directories so we can skip over them */
export const IGNORE_EXT: { [key: string]: boolean } = {
  '.ts': true,
  '.tsx': true,
  '.js': true,
  '.mjs': true,
  '.cjs': true,
  '.jsx': true,
  '.css': true,
  '.html': true,
  '.png': true,
  '.jpg': true,
  '.jpeg': true,
  '.gif': true,
  '.ico': true,
  '.svg': true,
  '.txt': true,
  '.json': true,
  '.yml': true,
  '.yaml': true,
  '.toml': true,
  '.lock': true,
  '.log': true,
  '.bazel': true,
  '.bzl': true,
};

/** Known file and directory names we know we can skip over */
export const IGNORE_NAMES: { [key: string]: boolean } = {
  build: true,
  dist: true,
  node_modules: true,
  target: true,
  LICENSE: true,
  'LICENSE.md': true,
  Dockerfile: true,
  Makefile: true,
  WORKSPACE: true,
  '.devcontainer': true,
  '.gitignore': true,
  '.gitattributese': true,
  '.gitkeep': true,
  '.github': true,
  '.husky': true,
  '.npmrc': true,
  '.nvmrc': true,
  '.prettierignore': true,
  '.history': true,
  '.vscode': true,
  '.DS_Store': true,
};