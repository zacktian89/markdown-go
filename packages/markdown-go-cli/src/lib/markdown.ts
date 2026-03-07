import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import plaintext from "highlight.js/lib/languages/plaintext";
import DOMPurify from "dompurify";
import { createLogger } from "./logger.js";

const logger = createLogger("Markdown");

// Register common languages for syntax highlighting
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("text", plaintext);
hljs.registerLanguage("plaintext", plaintext);

/**
 * Escape HTML special characters
 */
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Markdown-it instance configuration
 */
const md: MarkdownIt = new MarkdownIt({
  html: false, // Set to false for security, we handle HTML specifically
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: (code: string, lang: string): string => {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlight(code, { language: "plaintext" }).value;
    } catch (err) {
      logger.error(`Highlighting failed for language "${lang}"`, err);
      return escapeHtml(code);
    }
  }
}).use(taskLists, { enabled: true, label: true, labelAfter: true });

/**
 * Helper to inject line numbers into tokens for scroll synchronization
 */
const proxy = (tokens: any[], idx: number, options: any, env: any, self: any) => self.renderToken(tokens, idx, options);

function injectLineNumber(tokens: any[], idx: number) {
  if (tokens[idx].map && tokens[idx].level === 0) {
    const line = tokens[idx].map[0];
    tokens[idx].attrJoin("class", "source-line");
    tokens[idx].attrSet("data-line", String(line));
  }
}

// Attach line number injection to block-level elements
const blockTypes = [
  "paragraph_open", "heading_open", "blockquote_open", 
  "ordered_list_open", "bullet_list_open", "table_open", 
  "hr", "code_block", "fence"
];

blockTypes.forEach((type) => {
  const original = md.renderer.rules[type] || proxy;
  md.renderer.rules[type] = (tokens, idx, options, env, self) => {
    injectLineNumber(tokens, idx);
    return original(tokens, idx, options, env, self);
  };
});

/**
 * Renders Markdown string to sanitized HTML.
 * 
 * Features:
 * - Syntax highlighting with highlight.js
 * - Task lists support
 * - Line numbers for scroll sync
 * - XSS protection with DOMPurify
 */
export function renderMarkdownToHtml(markdown: string): string {
  try {
    const raw = md.render(markdown);
    // In Node.js environment, the imported DOMPurify is a factory function, 
    // but our CLI script provisions a globally instantiated initialized one.
    const purify = (DOMPurify as any).sanitize ? DOMPurify : (globalThis as any).DOMPurify || DOMPurify;
    return purify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["data-line"],
      // Allow specific protocols for image sources, including data URLs, blobs, and relative/local paths without colons
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|ftp):|blob:|wechatgoimg:|data:image\/(?:png|gif|jpe?g|webp);base64,|[^:]+$)/i
    });
  } catch (err) {
    logger.error("Failed to render markdown", err);
    return `<p>Error rendering markdown: ${escapeHtml(String(err))}</p>`;
  }
}




