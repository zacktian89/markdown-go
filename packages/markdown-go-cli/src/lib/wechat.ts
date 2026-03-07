import { renderMarkdownToHtml } from "./markdown.js";
import { WECHAT_LIGHT_THEME, type WeChatTheme } from "./wechatTheme.js";
import { createLogger } from "./logger.js";
import { initMermaid, renderMermaid } from "./mermaid.js";

const logger = createLogger("WeChatFormatter");

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
 * Preserve spaces and tabs for WeChat code blocks by converting them to &nbsp;
 */
function preserveSpacesForWechatCode(line: string) {
  // Convert tabs to 4 spaces first
  const expanded = line.replace(/\t/g, "    ");
  let out = "";
  let prevSpace = false;
  for (const ch of expanded) {
    if (ch === " ") {
      out += prevSpace ? "&nbsp;" : " ";
      prevSpace = true;
    } else {
      out += escapeHtml(ch);
      prevSpace = false;
    }
  }
  // Convert leading spaces to &nbsp; to prevent collapsing
  out = out.replace(/^ +/g, (m) => "&nbsp;".repeat(m.length));
  return out;
}

/**
 * Apply inline styles to elements based on the provided theme.
 * This is necessary because WeChat MP strips most external/internal CSS.
 */
function applyInlineStyles(root: HTMLElement, theme: WeChatTheme) {
  const set = (el: Element, style: string) => {
    const prev = el.getAttribute("style");
    el.setAttribute("style", prev ? `${prev};${style}` : style);
  };

  set(root, theme.root + ";word-break:break-all;overflow-wrap:break-word;");

  const walk = (node: Element) => {
    const tag = node.tagName.toLowerCase();

    // Headings (converted to p/span)
    if (tag === "p" && node.hasAttribute("data-wx-heading")) {
      const level = Number(node.getAttribute("data-wx-level") ?? "1") || 1;
      set(node, theme.headingBlock(level));
    }
    if (tag === "span" && node.hasAttribute("data-wx-heading-text")) {
      const level = Number(node.getAttribute("data-wx-level") ?? "1") || 1;
      set(node, theme.headingText(level));
    }

    // Code blocks
    if (node.hasAttribute("data-wx-codeblock")) {
      set(node, theme.codeBlockWrapper);
      if (tag !== "p" || !node.hasAttribute("data-wx-code")) set(node, "margin-bottom:16px");
    }
    if (tag === "p" && node.hasAttribute("data-wx-code")) {
      set(node, theme.codeBlockP);
      if (node.hasAttribute("data-wx-codeblock")) set(node, "margin-bottom:16px");
    }
    if (tag === "span" && node.hasAttribute("data-wx-code-text")) set(node, theme.codeBlockSpan);

    // List paragraphs (pseudo-lists)
    if (tag === "p" && node.hasAttribute("data-wx-list")) {
      const level = Number(node.getAttribute("data-wx-level") ?? "0") || 0;
      const ordered = node.getAttribute("data-wx-ordered") === "1";
      set(node, theme.listParagraph(level, ordered));
    }
    if (tag === "span" && node.hasAttribute("data-wx-list-bullet")) set(node, theme.listBullet);

    // Basic paragraphs
    if (tag === "p") {
      const bq = node.closest("blockquote");
      if (bq) {
        const isDirectChildOfBlockquote = node.parentElement === bq;
        const isLastDirectP =
          isDirectChildOfBlockquote &&
          (() => {
            const ps = Array.from(bq.children).filter((c) => c.tagName.toLowerCase() === "p");
            return ps.length > 0 && ps[ps.length - 1] === node;
          })();
        set(node, (isLastDirectP ? "margin:0" : "margin:0 0 10px 0") + ";color:inherit");
      } else {
        if (!node.hasAttribute("data-wx-heading") && !node.hasAttribute("data-wx-code") && !node.hasAttribute("data-wx-list")) {
          set(node, theme.paragraph);
        }
      }
    }

    // Inline elements
    if (tag === "strong") set(node, theme.strong);
    if (tag === "em") set(node, theme.em);
    if (tag === "a") set(node, theme.link);
    if (tag === "ul") set(node, theme.ul);
    if (tag === "ol") set(node, theme.ol);
    if (tag === "li") set(node, theme.li);
    if (tag === "blockquote") set(node, theme.blockquote);
    if (tag === "code" && node.parentElement?.tagName.toLowerCase() !== "pre") {
      set(node, theme.inlineCode);
    }
    if (tag === "img") set(node, theme.image);

    // Table elements
    if (tag === "table") set(node, theme.table);
    if (tag === "th") set(node, theme.th);
    if (tag === "td") set(node, theme.td);

    for (const child of Array.from(node.children)) walk(child);
  };

  walk(root);
}

/**
 * Transform HTML structure to be compatible with WeChat MP editor.
 * Includes heading flattening, code block conversion, and list flattening.
 */
/**
 * Map highlight.js class names to theme styles
 */
function mapHighlightClassToStyle(classList: DOMTokenList, theme: WeChatTheme): string {
  if (!theme.codeHighlight) return "";
  const { codeHighlight } = theme;

  if (classList.contains("hljs-keyword") || classList.contains("hljs-selector-tag") || classList.contains("hljs-subst")) return codeHighlight.keyword;
  if (classList.contains("hljs-string") || classList.contains("hljs-title") || classList.contains("hljs-section") || classList.contains("hljs-type") || classList.contains("hljs-symbol") || classList.contains("hljs-bullet") || classList.contains("hljs-attribute")) return codeHighlight.string;
  if (classList.contains("hljs-number") || classList.contains("hljs-literal")) return codeHighlight.number;
  if (classList.contains("hljs-comment") || classList.contains("hljs-quote")) return codeHighlight.comment;
  if (classList.contains("hljs-function") || (classList.contains("hljs-title") && classList.contains("function_"))) return codeHighlight.function;
  if (classList.contains("hljs-built_in") || classList.contains("hljs-doctag")) return codeHighlight.keyword;
  if (classList.contains("hljs-operator")) return codeHighlight.operator;
  if (classList.contains("hljs-punctuation")) return codeHighlight.punctuation;
  if (classList.contains("hljs-variable") || classList.contains("hljs-template-variable")) return codeHighlight.variable;
  if (classList.contains("hljs-property")) return codeHighlight.property;
  if (classList.contains("hljs-class") || (classList.contains("hljs-title") && classList.contains("class_"))) return codeHighlight.className;
  if (classList.contains("hljs-tag") || classList.contains("hljs-name")) return codeHighlight.tag;
  if (classList.contains("hljs-attr")) return codeHighlight.attr;
  if (classList.contains("hljs-attr-value")) return codeHighlight.attrValue;

  return "";
}

/**
 * Traverses the code DOM to inline styles and handle spacing/newlines
 */
function processCodeNode(node: Node, theme?: WeChatTheme): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    // Simple replacement: spaces to &nbsp; and newlines to <br/>
    // We escape HTML first to avoid injection
    return escapeHtml(text)
      .replace(/ /g, "&nbsp;")
      .replace(/\n/g, "<br/>");
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    let style = "";
    if (theme) {
      const mapped = mapHighlightClassToStyle(el.classList, theme);
      if (mapped) style = normalizeStyleBlock(mapped);
    }

    // Recursive processing
    const childrenHtml = Array.from(node.childNodes).map(c => processCodeNode(c, theme)).join("");

    const classAttr = el.className ? ` class="${el.className}"` : "";
    const styleAttr = style ? ` style="${style}"` : "";

    // Reconstruct the element with existing classes and new inline styles
    return `<${tagName}${classAttr}${styleAttr}>${childrenHtml}</${tagName}>`;
  }
  return "";
}

/**
 * Transform HTML structure to be compatible with WeChat MP editor.
 * Includes heading flattening, code block conversion, and list flattening.
 */
function transformStructureForWechat(container: HTMLElement, theme?: WeChatTheme) {
  // 1) Heading flattening: h1~h6 -> p + span
  const headings = Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  for (const h of headings) {
    const level = Number(h.tagName.slice(1)) || 1;
    const p = document.createElement("p");
    p.setAttribute("data-wx-heading", "1");
    p.setAttribute("data-wx-level", String(level));

    const line = h.getAttribute("data-line");
    if (line) p.setAttribute("data-line", line);

    const span = document.createElement("span");
    span.setAttribute("data-wx-heading-text", "1");
    span.setAttribute("data-wx-level", String(level));
    span.innerHTML = h.innerHTML;
    p.appendChild(span);
    h.replaceWith(p);
  }

  // 2) Code blocks: pre > code -> p + span + (retained html)
  const pres = Array.from(container.querySelectorAll("pre"));
  for (const pre of pres) {
    const code = pre.querySelector("code");
    // If we have a theme and codeHighlight, we use the DOM traversal method
    // Otherwise fallback to text processing (although we might just use DOM traversal always for consistency)
    const useRichProcessing = !!(theme && theme.codeHighlight);

    const p = document.createElement("p");
    p.setAttribute("data-wx-code", "1");
    p.setAttribute("data-wx-codeblock", "1");

    const line = pre.getAttribute("data-line");
    if (line) p.setAttribute("data-line", line);

    const span = document.createElement("span");
    span.setAttribute("data-wx-code-text", "1");

    if (useRichProcessing && code) {
      // Use the rich processing to retain styles
      span.innerHTML = processCodeNode(code, theme);
    } else {
      // Fallback: simplified processing (original logic)
      const rawText = (code ?? pre).textContent ?? "";
      const lines = rawText.replace(/\r\n/g, "\n").split("\n");
      const html = lines.map((ln) => preserveSpacesForWechatCode(ln)).join("<br/>");
      span.innerHTML = html;
    }

    p.appendChild(span);
    pre.replaceWith(p);
  }

  // 3) List flattening: ul/ol -> sequence of p (pseudo-lists)
  const flattenList = (listEl: HTMLOListElement | HTMLUListElement, level: number): Node[] => {
    const ordered = listEl.tagName.toLowerCase() === "ol";
    let index = 1;
    const out: Node[] = [];
    const listLine = listEl.getAttribute("data-line");

    const items = Array.from(listEl.querySelectorAll(":scope > li"));
    for (const li of items) {
      const contentSpan = document.createElement("span");
      while (li.firstChild) {
        const n = li.firstChild;
        if (n.nodeType === Node.ELEMENT_NODE) {
          const tag = (n as Element).tagName.toLowerCase();
          if (tag === "ul" || tag === "ol") break;
          if (tag === "p") {
            const p = n as HTMLParagraphElement;
            const nodes = Array.from(p.childNodes);
            p.remove();
            contentSpan.append(...nodes);
            continue;
          }
        }
        contentSpan.appendChild(n);
      }

      // Handle task lists
      const checkbox = contentSpan.querySelector('input[type="checkbox"], input.task-list-item-checkbox');
      let taskBullet: string | null = null;
      if (checkbox) {
        const checked = (checkbox as HTMLInputElement).checked;
        taskBullet = checked ? "☑ " : "☐ ";
        checkbox.remove();

        const label = contentSpan.querySelector("label");
        if (label) {
          const fragment = document.createDocumentFragment();
          while (label.firstChild) fragment.appendChild(label.firstChild);
          label.replaceWith(fragment);
        }
      }

      const p = document.createElement("p");
      p.setAttribute("data-wx-list", "1");
      p.setAttribute("data-wx-level", String(level));
      p.setAttribute("data-wx-ordered", ordered ? "1" : "0");

      const itemLine = li.getAttribute("data-line") || listLine;
      if (itemLine) p.setAttribute("data-line", itemLine);

      const bullet = document.createElement("span");
      bullet.setAttribute("data-wx-list-bullet", "1");
      if (taskBullet) {
        bullet.textContent = taskBullet;
      } else {
        bullet.textContent = ordered ? `${index}. ` : "• ";
      }

      p.appendChild(bullet);
      while (contentSpan.firstChild) {
        p.appendChild(contentSpan.firstChild);
      }

      out.push(p);
      index += 1;

      // Recursive handling of nested lists
      const nested = Array.from(li.children).filter((c) => {
        const t = c.tagName.toLowerCase();
        return t === "ul" || t === "ol";
      }) as Array<HTMLUListElement | HTMLOListElement>;
      for (const nl of nested) out.push(...flattenList(nl, level + 1));
    }
    return out;
  };

  const lists = Array.from(container.querySelectorAll("ul,ol"));
  for (const list of lists) {
    const parentList = list.parentElement?.closest("ul,ol");
    if (parentList) continue;

    const nodes = flattenList(list as HTMLUListElement | HTMLOListElement, 0);
    list.replaceWith(...nodes);
  }
}

/**
 * Full transformation for WeChat paste (structure + inline styles)
 */
function transformForWechatPaste(container: HTMLElement, theme: WeChatTheme) {
  transformStructureForWechat(container, theme);
  applyInlineStyles(container, theme);
}

/**
 * Apply font size override to a style block
 */
function applyFontSizeOverride(style: string, fontSize?: number): string {
  if (!fontSize) return style;
  const normalized = normalizeStyleBlock(style);
  if (/\bfont-size\s*:/.test(normalized)) {
    return normalized.replace(/\bfont-size\s*:\s*\d+px/g, `font-size:${fontSize}px`);
  }
  return normalized + `font-size:${fontSize}px;`;
}

// Mermaid 代码块匹配正则
const MERMAID_BLOCK_REGEX = /```(?:mermaid|mmd)\s*\n([\s\S]*?)```/g;

/**
 * 预处理 Markdown 中的 Mermaid 代码块
 * 将 Mermaid 代码块替换为占位符，同时渲染为 PNG 图片并返回映射
 * 
 * 使用 PNG 而非 SVG 的原因：
 * - 微信后台会剥离 SVG 中的 CSS 类和样式，导致渲染异常
 * - PNG 是位图格式，所有样式都已"烘焙"到像素中，不会有格式问题
 * 
 * @returns 包含处理后的 Markdown 和占位符到图片 HTML 映射的对象
 */
async function preprocessMermaidBlocks(markdown: string): Promise<{
  processedMarkdown: string;
  svgMap: Map<string, string>;  // 保持变量名兼容，实际存储的是包含 <img> 的 HTML
}> {
  // 初始化 Mermaid（使用浅色主题，启用导出模式禁用 htmlLabels）
  initMermaid(false, true);

  const svgMap = new Map<string, string>();

  // 查找所有 Mermaid 代码块
  const matches: Array<{ fullMatch: string; code: string; index: number }> = [];
  let match: RegExpExecArray | null;

  // 重置正则
  MERMAID_BLOCK_REGEX.lastIndex = 0;

  while ((match = MERMAID_BLOCK_REGEX.exec(markdown)) !== null) {
    matches.push({
      fullMatch: match[0],
      code: match[1].trim(),
      index: match.index
    });
  }

  if (matches.length === 0) {
    return { processedMarkdown: markdown, svgMap };
  }

  logger.info(`Found ${matches.length} Mermaid block(s) to render as PNG`);

  // 渲染所有 Mermaid 代码块并用唯一占位符替换
  let result = markdown;
  let offset = 0;
  const timestamp = Date.now();

  // 动态导入 svgStringToPngDataUrl 以避免循环依赖
  const { svgStringToPngDataUrl } = await import('./mermaid.js');

  for (let i = 0; i < matches.length; i++) {
    const { fullMatch, code, index } = matches[i];
    // 使用唯一的占位符
    const placeholder = `MERMAIDPNGPLACEHOLDER${timestamp}N${i}END`;

    try {
      // 1. 渲染 Mermaid 图表为 SVG
      const svg = await renderMermaid(code, `mermaid-wechat-${timestamp}-${i}`);

      // 2. 将 SVG 转换为 PNG Data URL
      const pngDataUrl = await svgStringToPngDataUrl(svg, 2); // 2x 分辨率确保清晰

      // 3. 创建包含 PNG 图片的 HTML
      // 使用 base64 data URL，微信后台能够正确处理
      const imgHtml = `<div style="text-align: center; margin: 16px 0;"><img src="${pngDataUrl}" alt="Mermaid Diagram" style="max-width: 100%; height: auto; display: inline-block;" /></div>`;

      // 存储占位符到图片 HTML 的映射
      svgMap.set(placeholder, imgHtml);

      // 用占位符替换原始代码块
      const adjustedIndex = index + offset;
      result = result.slice(0, adjustedIndex) + placeholder + result.slice(adjustedIndex + fullMatch.length);

      // 更新偏移量
      offset += placeholder.length - fullMatch.length;

      logger.debug(`Rendered Mermaid block ${i + 1}/${matches.length} as PNG`);
    } catch (err) {
      logger.error(`Failed to render Mermaid block ${i + 1}`, err);
      // 如果渲染失败，保留原始代码块（会被当作普通代码块处理）
    }
  }

  return { processedMarkdown: result, svgMap };
}

/**
 * Main entry point: Render Markdown to HTML compatible with WeChat MP paste
 * (同步版本，不处理 Mermaid 图表)
 */
export function renderMarkdownToWeChatHtml(
  markdown: string,
  theme: WeChatTheme = WECHAT_LIGHT_THEME,
  opts: { fontSize?: number } = {}
) {
  logger.info(`Rendering markdown to WeChat HTML (Font: ${opts.fontSize ?? 'default'})`);
  const raw = renderMarkdownToHtml(markdown);
  const host = document.createElement("div");
  host.innerHTML = raw;

  const effectiveTheme: WeChatTheme = opts.fontSize ? {
    ...theme,
    root: applyFontSizeOverride(theme.root, opts.fontSize),
    paragraph: applyFontSizeOverride(theme.paragraph, opts.fontSize),
    listParagraph: (level: number, ordered: boolean) =>
      applyFontSizeOverride(theme.listParagraph(level, ordered), opts.fontSize)
  } : theme;

  transformForWechatPaste(host, effectiveTheme);

  // Wrap in another div to preserve context
  const outer = document.createElement("div");
  outer.append(...Array.from(host.childNodes));
  applyInlineStyles(outer, effectiveTheme);
  return outer.outerHTML;
}

/**
 * Async version: Render Markdown to HTML compatible with WeChat MP paste
 * This version pre-processes Mermaid diagrams and renders them to SVG
 * 
 * @param markdown - Markdown source text
 * @param theme - WeChat theme to apply  
 * @param opts - Additional options (fontSize)
 * @returns Promise resolving to HTML string
 */
export async function renderMarkdownToWeChatHtmlAsync(
  markdown: string,
  theme: WeChatTheme = WECHAT_LIGHT_THEME,
  opts: { fontSize?: number } = {}
): Promise<string> {
  logger.info(`Rendering markdown to WeChat HTML async (Font: ${opts.fontSize ?? 'default'})`);

  // 预处理 Mermaid 代码块，将其替换为占位符并记录 SVG
  const { processedMarkdown, svgMap } = await preprocessMermaidBlocks(markdown);

  // 如果没有 Mermaid 代码块，直接使用同步版本渲染
  if (svgMap.size === 0) {
    return renderMarkdownToWeChatHtml(processedMarkdown, theme, opts);
  }

  logger.debug(`Rendering with ${svgMap.size} Mermaid diagram(s)`);

  // 使用同步版本渲染（此时 Mermaid 代码块已被替换为占位符）
  let html = renderMarkdownToWeChatHtml(processedMarkdown, theme, opts);

  // 将占位符替换回 PNG 图片 HTML
  for (const [placeholder, imgHtml] of svgMap) {
    // 占位符可能被转义或包裹在各种标签中
    // 1. 被 <p> 标签包裹
    html = html.replace(new RegExp(`<p[^>]*>[^<]*${placeholder}[^<]*</p>`, 'g'), imgHtml);
    // 2. 被 <code> 标签包裹
    html = html.replace(new RegExp(`<code[^>]*>${placeholder}</code>`, 'g'), imgHtml);
    // 3. 直接替换（可能被转义也可能没有）
    html = html.replace(new RegExp(placeholder, 'g'), imgHtml);
  }

  return html;
}

/**
 * Normalize CSS style block by ensuring it ends with a semicolon
 */
function normalizeStyleBlock(style: string) {
  const s = style.trim();
  if (!s) return "";
  return s.endsWith(";") ? s : `${s};`;
}

/**
 * Generate CSS for preview purposes
 */
function themeToCss(theme: WeChatTheme, opts: { fontSize?: number } = {}) {
  const effectiveTheme: WeChatTheme = opts.fontSize ? {
    ...theme,
    root: applyFontSizeOverride(theme.root, opts.fontSize),
    paragraph: applyFontSizeOverride(theme.paragraph, opts.fontSize),
    listParagraph: (level: number, ordered: boolean) =>
      applyFontSizeOverride(theme.listParagraph(level, ordered), opts.fontSize)
  } : theme;

  const out: string[] = [];
  out.push(`.wx-root{${normalizeStyleBlock(effectiveTheme.root)}word-break:break-all;overflow-wrap:break-word;}`);
  out.push(
    `.wx-root p:not([data-wx-heading]):not([data-wx-code]):not([data-wx-list]){${normalizeStyleBlock(effectiveTheme.paragraph)}}`
  );
  out.push(
    `.wx-root blockquote p:not([data-wx-heading]):not([data-wx-code]):not([data-wx-list]){margin:0 !important;color:inherit;}`
  );
  out.push(
    `.wx-root blockquote p:not([data-wx-heading]):not([data-wx-code]):not([data-wx-list]):not(:last-child){margin:0 0 10px 0 !important;}`
  );

  for (let level = 1; level <= 6; level += 1) {
    out.push(
      `.wx-root p[data-wx-heading][data-wx-level="${level}"]{${normalizeStyleBlock(effectiveTheme.headingBlock(level))}}`
    );
    out.push(
      `.wx-root span[data-wx-heading-text][data-wx-level="${level}"]{${normalizeStyleBlock(effectiveTheme.headingText(level))}}`
    );
  }

  for (let level = 0; level <= 6; level += 1) {
    out.push(
      `.wx-root p[data-wx-list][data-wx-level="${level}"][data-wx-ordered="0"]{${normalizeStyleBlock(
        effectiveTheme.listParagraph(level, false)
      )}}`
    );
    out.push(
      `.wx-root p[data-wx-list][data-wx-level="${level}"][data-wx-ordered="1"]{${normalizeStyleBlock(
        effectiveTheme.listParagraph(level, true)
      )}}`
    );
  }
  out.push(`.wx-root span[data-wx-list-bullet]{${normalizeStyleBlock(effectiveTheme.listBullet)}}`);
  out.push(`.wx-root p[data-wx-list][data-wx-ordered="1"] span[data-wx-list-bullet]{color:inherit;}`);
  out.push(
    `.wx-root p[data-wx-list][data-wx-ordered="1"]{margin-top:0 !important;margin-bottom:0 !important;}`
  );

  out.push(`.wx-root strong{${normalizeStyleBlock(effectiveTheme.strong)}}`);
  out.push(`.wx-root em{${normalizeStyleBlock(effectiveTheme.em)}}`);
  out.push(`.wx-root a{${normalizeStyleBlock(effectiveTheme.link)}}`);
  out.push(`.wx-root ul{${normalizeStyleBlock(effectiveTheme.ul)}}`);
  out.push(`.wx-root ol{${normalizeStyleBlock(effectiveTheme.ol)}}`);
  out.push(`.wx-root li{${normalizeStyleBlock(effectiveTheme.li)}}`);
  out.push(`.wx-root blockquote{${normalizeStyleBlock(effectiveTheme.blockquote)}}`);
  out.push(`.wx-root code{${normalizeStyleBlock(effectiveTheme.inlineCode)}}`);
  // Force reset code styles inside code blocks to prevent inlineCode styles from leaking (e.g. background color stripes, borders)
  out.push(`.wx-root pre code, .wx-root [data-wx-codeblock] code, .wx-root [data-wx-codeblock] span { background-color: transparent !important; border: none !important; box-shadow: none !important; outline: none !important; padding: 0 !important; border-radius: 0 !important; margin: 0 !important; color: inherit; }`);
  out.push(`.wx-root img{${normalizeStyleBlock(effectiveTheme.image)}}`);

  out.push(`.wx-root div[data-wx-codeblock]{${normalizeStyleBlock(effectiveTheme.codeBlockWrapper)}margin-bottom:16px;}`);
  out.push(`.wx-root p[data-wx-codeblock]{${normalizeStyleBlock(effectiveTheme.codeBlockWrapper)}margin-bottom:16px;}`);
  out.push(`.wx-root p[data-wx-code]{${normalizeStyleBlock(effectiveTheme.codeBlockP)}}`);
  out.push(`.wx-root table{${normalizeStyleBlock(effectiveTheme.table)}}`);
  out.push(`.wx-root th{${normalizeStyleBlock(effectiveTheme.th)}}`);
  out.push(`.wx-root td{${normalizeStyleBlock(effectiveTheme.td)}}`);

  // Generate highlight.js CSS based on theme.codeHighlight
  if (effectiveTheme.codeHighlight) {
    const { codeHighlight } = effectiveTheme;
    out.push(`.wx-root .hljs-keyword, .wx-root .hljs-selector-tag, .wx-root .hljs-subst { ${normalizeStyleBlock(codeHighlight.keyword)} }`);
    out.push(`.wx-root .hljs-string, .wx-root .hljs-title, .wx-root .hljs-section, .wx-root .hljs-type, .wx-root .hljs-symbol, .wx-root .hljs-bullet, .wx-root .hljs-attribute { ${normalizeStyleBlock(codeHighlight.string)} }`);
    out.push(`.wx-root .hljs-number, .wx-root .hljs-literal { ${normalizeStyleBlock(codeHighlight.number)} }`);
    out.push(`.wx-root .hljs-comment, .wx-root .hljs-quote { ${normalizeStyleBlock(codeHighlight.comment)} }`);
    out.push(`.wx-root .hljs-function, .wx-root .hljs-function > .hljs-title { ${normalizeStyleBlock(codeHighlight.function)} }`);
    out.push(`.wx-root .hljs-built_in, .wx-root .hljs-doctag { ${normalizeStyleBlock(codeHighlight.keyword)} }`);
    out.push(`.wx-root .hljs-operator { ${normalizeStyleBlock(codeHighlight.operator)} }`);
    out.push(`.wx-root .hljs-punctuation { ${normalizeStyleBlock(codeHighlight.punctuation)} }`);
    out.push(`.wx-root .hljs-variable, .wx-root .hljs-template-variable { ${normalizeStyleBlock(codeHighlight.variable)} }`);
    out.push(`.wx-root .hljs-property { ${normalizeStyleBlock(codeHighlight.property)} }`);
    out.push(`.wx-root .hljs-class .hljs-title, .wx-root .hljs-title.class_ { ${normalizeStyleBlock(codeHighlight.className)} }`);
    out.push(`.wx-root .hljs-tag, .wx-root .hljs-name { ${normalizeStyleBlock(codeHighlight.tag)} }`);
    out.push(`.wx-root .hljs-attr { ${normalizeStyleBlock(codeHighlight.attr)} }`);
    out.push(`.wx-root .hljs-attr-value { ${normalizeStyleBlock(codeHighlight.attrValue)} }`);
  }

  return out.join("\n");
}

/**
 * Render Markdown to HTML for previewing (uses internal <style> tag)
 */
export function renderMarkdownToWeChatPreviewHtml(
  markdown: string,
  theme: WeChatTheme = WECHAT_LIGHT_THEME,
  opts: { fontSize?: number } = {}
) {
  logger.debug("Rendering markdown to WeChat preview HTML");
  const raw = renderMarkdownToHtml(markdown);
  const host = document.createElement("div");
  host.innerHTML = raw;

  transformStructureForWechat(host, theme);

  const cssText = themeToCss(theme, opts);
  return `<style>${cssText}</style><div class="wx-root">${host.innerHTML}</div>`;
}

/**
 * Convert HTML to plain text (strips all tags)
 */
function htmlToPlainText(html: string) {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.innerText;
}

/**
 * Copy WeChat-formatted HTML to clipboard
 * Uses async rendering to properly render Mermaid diagrams as SVG
 */
export async function copyWeChatToClipboard(
  markdown: string,
  theme: WeChatTheme = WECHAT_LIGHT_THEME,
  opts: { fontSize?: number } = {}
) {
  logger.info("Copying WeChat formatted content to clipboard");

  // 使用异步版本渲染，这样 Mermaid 图表会被正确渲染为 SVG
  const html = await renderMarkdownToWeChatHtmlAsync(markdown, theme, opts);
  const plain = htmlToPlainText(html);

  // Try to write both HTML and Plain text for rich pasting
  if (navigator.clipboard && "write" in navigator.clipboard && typeof (window as any).ClipboardItem !== "undefined") {
    try {
      const ClipboardItemCtor = (window as any).ClipboardItem as typeof ClipboardItem;
      const item = new ClipboardItemCtor({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" })
      });
      await navigator.clipboard.write([item]);
      logger.info("Content copied to clipboard as text/html");
      return;
    } catch (err) {
      logger.error("Failed to copy with ClipboardItem, falling back...", err);
    }
  }

  // Fallback 1: Plain text only
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(plain);
    logger.warn("Content copied to clipboard as plain text only (fallback)");
    return;
  }

  // Fallback 2: execCommand
  const ta = document.createElement("textarea");
  ta.value = plain;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.style.top = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand("copy");
  ta.remove();
  logger.warn("Content copied to clipboard using execCommand (deep fallback)");
}



