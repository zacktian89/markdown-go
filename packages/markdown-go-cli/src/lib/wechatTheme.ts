export type WeChatTheme = {
  root: string;

  paragraph: string;
  headingBlock: (level: number) => string; // applied to the wrapping <p>
  headingText: (level: number) => string; // applied to the inner <span>

  strong: string;
  em: string;
  link: string;

  ul: string;
  ol: string;
  li: string;
  // 公众号“伪列表段落”（ul/ol 会被展开为 p[data-wx-list]），需要主题自定义，否则切主题列表不会跟着变
  listParagraph: (level: number, ordered: boolean) => string; // applied to p[data-wx-list]
  listBullet: string; // applied to the bullet <span>

  blockquote: string;

  inlineCode: string;

  codeBlockWrapper: string;
  codeBlockP: string;
  codeBlockSpan: string;

  image: string;

  // 表格样式
  table: string;
  th: string;
  td: string;

  // 代码块语法高亮 - 各类型 token 的颜色样式
  codeHighlight: {
    keyword: string;      // 关键字 (if, else, const, function, etc.)
    string: string;       // 字符串
    number: string;       // 数字
    comment: string;      // 注释
    function: string;     // 函数名
    operator: string;     // 运算符
    punctuation: string;  // 标点符号
    variable: string;     // 变量
    property: string;     // 属性
    className: string;    // 类名
    tag: string;          // HTML/XML 标签
    attr: string;         // 属性名
    attrValue: string;    // 属性值
  };
};

export type WeChatThemePreset = {
  id: string;
  name: string;
  theme: WeChatTheme;
};

// 统一拼接 CSS declaration block，保证末尾分号，便于后续扩展/复制
function css(decls: Array<string | false | null | undefined>, joinWith = ";") {
  const s = decls.filter(Boolean).join(joinWith);
  return s.endsWith(";") ? s : `${s};`;
}

function makeListParagraphStyle(opts: {
  fontSizePx: number;
  lineHeight: number;
  color: string;
  baseIndentPx?: number;
  indentPerLevelPx?: number;
  orderedHangPx?: number;
  unorderedHangPx?: number;
}) {
  const {
    fontSizePx,
    lineHeight,
    color,
    baseIndentPx = 22,
    indentPerLevelPx = 18,
    orderedHangPx = 30,
    unorderedHangPx = 22
  } = opts;
  return (level: number, ordered: boolean) => {
    const indent = baseIndentPx + level * indentPerLevelPx;
    // 防止“悬挂缩进(hang) > 当前缩进(indent)”导致序号/子弹被拉到容器左边界之外（表现为“太靠左、不对齐”）。
    const hangWanted = ordered ? orderedHangPx : unorderedHangPx;
    const hang = Math.min(hangWanted, indent);
    return css([
      "margin:0 0 10px 0",
      `line-height:${lineHeight}`,
      `color:${color}`,
      `font-size:${fontSizePx}px`,
      "text-align:left",
      `padding-left:${indent}px`,
      `text-indent:-${hang}px`
    ]);
  };
}

function makeListBulletStyle() {
  // 统一为轻灰色子弹；若后续要主题化，可在各主题里覆写
  return css(["color:#94a3b8", "font-weight:700"]);
}

/**
 * 生成默认的表格样式
 */
function makeTableStyles(opts: {
  borderColor?: string;
  headerBg?: string;
  headerColor?: string;
  cellBg?: string;
  cellColor?: string;
  altRowBg?: string;
} = {}) {
  const {
    borderColor = "#e5e7eb",
    headerBg = "#f9fafb",
    headerColor = "#374151",
    cellBg = "transparent",
    cellColor = "#374151",
  } = opts;

  return {
    table: css([
      "width:100%",
      "border-collapse:collapse",
      "margin:16px 0",
      `border:1px solid ${borderColor}`,
      "font-size:14px",
      "line-height:1.6"
    ]),
    th: css([
      `background-color:${headerBg}`,
      `color:${headerColor}`,
      "font-weight:600",
      "text-align:left",
      "padding:10px 12px",
      `border:1px solid ${borderColor}`
    ]),
    td: css([
      `background-color:${cellBg}`,
      `color:${cellColor}`,
      "padding:10px 12px",
      `border:1px solid ${borderColor}`,
      "text-align:left"
    ])
  };
}

/**
 * 代码高亮颜色预设
 * 基于常见 IDE 主题设计，确保在不同代码类型间有良好的区分度
 */

// 浅色主题代码高亮（类似 GitHub Light / VS Code Light+）
const CODE_HIGHLIGHT_LIGHT = {
  keyword: "color:#d73a49;",      // 红色 - if, const, function 等
  string: "color:#032f62;",       // 深蓝 - 字符串
  number: "color:#005cc5;",       // 蓝色 - 数字
  comment: "color:#6a737d;font-style:italic;", // 灰色斜体 - 注释
  function: "color:#6f42c1;",     // 紫色 - 函数名
  operator: "color:#d73a49;",     // 红色 - 运算符
  punctuation: "color:#24292e;",  // 近黑 - 括号、分号等
  variable: "color:#e36209;",     // 橙色 - 变量
  property: "color:#005cc5;",     // 蓝色 - 属性
  className: "color:#6f42c1;",    // 紫色 - 类名
  tag: "color:#22863a;",          // 绿色 - HTML标签
  attr: "color:#6f42c1;",         // 紫色 - 属性名
  attrValue: "color:#032f62;",    // 深蓝 - 属性值
};

// 深色主题代码高亮（类似 One Dark / VS Code Dark+）
const CODE_HIGHLIGHT_DARK = {
  keyword: "color:#c678dd;",      // 紫色 - if, const, function 等
  string: "color:#98c379;",       // 绿色 - 字符串
  number: "color:#d19a66;",       // 橙色 - 数字
  comment: "color:#7f848e;font-style:italic;", // 灰色斜体 - 注释
  function: "color:#61afef;",     // 蓝色 - 函数名
  operator: "color:#56b6c2;",     // 青色 - 运算符
  punctuation: "color:#abb2bf;",  // 浅灰 - 括号、分号等
  variable: "color:#e06c75;",     // 红色 - 变量
  property: "color:#e06c75;",     // 红色 - 属性
  className: "color:#e5c07b;",    // 黄色 - 类名
  tag: "color:#e06c75;",          // 红色 - HTML标签
  attr: "color:#d19a66;",         // 橙色 - 属性名
  attrValue: "color:#98c379;",    // 绿色 - 属性值
};

// 暖色调代码高亮（类似 Solarized Light）
const CODE_HIGHLIGHT_WARM = {
  keyword: "color:#859900;",      // 绿色 - if, const, function 等
  string: "color:#2aa198;",       // 青色 - 字符串
  number: "color:#d33682;",       // 品红 - 数字
  comment: "color:#93a1a1;font-style:italic;", // 灰色斜体 - 注释
  function: "color:#268bd2;",     // 蓝色 - 函数名
  operator: "color:#657b83;",     // 灰色 - 运算符
  punctuation: "color:#657b83;",  // 灰色 - 括号、分号等
  variable: "color:#b58900;",     // 黄色 - 变量
  property: "color:#268bd2;",     // 蓝色 - 属性
  className: "color:#b58900;",    // 黄色 - 类名
  tag: "color:#268bd2;",          // 蓝色 - HTML标签
  attr: "color:#93a1a1;",         // 灰色 - 属性名
  attrValue: "color:#2aa198;",    // 青色 - 属性值
};

// 高对比深色代码高亮（漫威/霓虹等主题）
const CODE_HIGHLIGHT_NEON = {
  keyword: "color:#ff79c6;",      // 粉色 - if, const, function 等
  string: "color:#f1fa8c;",       // 黄色 - 字符串
  number: "color:#bd93f9;",       // 紫色 - 数字
  comment: "color:#6272a4;font-style:italic;", // 灰蓝斜体 - 注释
  function: "color:#50fa7b;",     // 绿色 - 函数名
  operator: "color:#ff79c6;",     // 粉色 - 运算符
  punctuation: "color:#f8f8f2;",  // 白色 - 括号、分号等
  variable: "color:#f1fa8c;",     // 黄色 - 变量
  property: "color:#8be9fd;",     // 青色 - 属性
  className: "color:#50fa7b;",    // 绿色 - 类名
  tag: "color:#ff79c6;",          // 粉色 - HTML标签
  attr: "color:#50fa7b;",         // 绿色 - 属性名
  attrValue: "color:#f1fa8c;",    // 黄色 - 属性值
};

/**
 * 微信公众号文章页的“默认字体”本质是系统字体（不同平台不同）。
 * 为了在 iOS/Android/Windows/macOS 上尽量接近公众号默认阅读体验，这里统一使用跨平台系统字体栈。
 * 注意：公众号后台可能会重写/忽略部分字体设置，但保留稳定的回退顺序依然很重要。
 */
const WECHAT_BODY_FONT_FAMILY =
  '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Helvetica,Arial,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC","Source Han Sans SC",sans-serif';

// 代码字体：优先 macOS 常见等宽，其次 Windows（Consolas/Courier New）
const WECHAT_CODE_FONT_FAMILY = 'Menlo,Monaco,Consolas,"Courier New",monospace';
export const WECHAT_LIGHT_SIMPLE_THEME: WeChatTheme = {
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.7",
    "color:#2c3e50", // 偏深蓝的灰，比纯黑柔和
    "text-align:left",
    "letter-spacing:0.5px"
  ].join(";"),

  paragraph: css(["margin:0 0 16px 0", "font-size:15px", "color:#2c3e50", "text-align:left"]),

  headingBlock: (level) => {
    // 极简风格不使用背景色块，依靠留白(Margin)来区分模块
    if (level === 1) {
      return "margin:32px 0 24px 0;text-align:center;border-bottom:1px solid #eaeaea;padding-bottom:15px;";
    }
    if (level === 2) {
      // H2 左侧加粗黑线，无背景
      return "margin:36px 0 16px 0;padding-left:10px;border-left:4px solid #000000;";
    }
    if (level === 3) {
      return "margin:24px 0 12px 0;";
    }
    return "margin:20px 0 10px 0;";
  },

  headingText: (level) => {
    if (level === 1) return "font-size:26px;font-weight:800;color:#000000;line-height:1.2;";
    if (level === 2) return "font-size:22px;font-weight:800;color:#000000;line-height:1.3;";
    if (level === 3) return "font-size:18px;font-weight:700;color:#333333;line-height:1.4;";
    return "font-size:16px;font-weight:700;color:#333333;";
  },

  strong: "font-weight:700;color:#000000;", // 纯黑强调
  em: "font-style:italic;color:#666;",

  // 链接：极简黑下划线，不使用蓝色
  link: css(["color:#000000", "text-decoration:underline", "font-weight:500", "border-bottom:1px solid #000"]),

  ul: css(["margin:0 0 24px 0", "padding-left:22px"]),
  ol: css(["margin:0 0 24px 0", "padding-left:22px"]),
  li: css(["margin:8px 0", "line-height:1.8", "color:#2c3e50"]),
  listParagraph: makeListParagraphStyle({ fontSizePx: 15, lineHeight: 1.8, color: "#2c3e50" }),
  listBullet: makeListBulletStyle(),

  // 引用：类似 Notion 的灰色侧边线
  blockquote: [
    "margin:0 0 24px 0",
    "padding:10px 18px",
    "background-color:transparent", // 无背景
    "border-left:3px solid #333", // 黑线
    "color:#333333", // 加深颜色，确保在白色背景上可见
    "font-size:15px",
    "font-style:italic"
  ].join(";"),

  inlineCode: [
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:14px",
    "background-color:#f3f4f6", // 浅灰
    "padding:2px 6px",
    "border-radius:4px",
    "color:#e11d48" // 玫红色文字，对比清晰
  ].join(";"),

  // 代码块：浅色背景，更像书本
  codeBlockWrapper: [
    "margin:24px 0",
    "padding:16px",
    "background-color:#f9fafb", // 极浅灰
    "border:1px solid #e5e7eb",
    "border-radius:6px"
  ].join(";"),
  codeBlockP: css(["margin:0", "line-height:1.7"]),
  codeBlockSpan: [
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:13px",
    "color:#374151" // 深灰代码字
  ].join(";"),

  image: css(["display:block", "margin:30px auto", "max-width:100%", "height:auto", "border-radius:0"]), // 图片直角，更硬朗

  // 表格样式
  ...makeTableStyles({
    borderColor: "#e5e7eb",
    headerBg: "#f9fafb",
    headerColor: "#1a1a1a",
    cellColor: "#2c3e50"
  }),

  // 代码高亮 - 使用浅色方案
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};


export const WECHAT_LIGHT_THEME1: WeChatTheme = {
  // 基础：使用深灰字色，提升阅读舒适度
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.7",
    "color:#333333",
    "word-break:break-word",
    "text-align:left",
    "letter-spacing:0.5px"
  ].join(";"),

  paragraph: css(["margin:0 0 16px 0", "color:#333333", "font-size:15px", "text-align:left"]),

  headingBlock: (level) => {
    // H1：居中+下划线，作为大标题
    if (level === 1) {
      return "margin:28px 0 20px 0;text-align:center;padding-bottom:10px;border-bottom:2px solid #1772b4;";
    }
    // H2：经典的“左侧蓝条+浅蓝底色”胶囊样式
    if (level === 2) {
      return [
        "margin:32px 0 18px 0",
        "padding:8px 16px",
        "background-color:#eff6ff", // 极浅的蓝
        "border-left:5px solid #1772b4", // 科技蓝
        "border-radius:4px"
      ].join(";");
    }
    // H3：仅左侧蓝条，无底色
    if (level === 3) {
      return "margin:24px 0 12px 0;padding-left:12px;border-left:4px solid #1772b4;";
    }
    return "margin:20px 0 10px 0;";
  },

  headingText: (level) => {
    if (level === 1) return "font-size:22px;font-weight:bold;color:#1772b4;";
    if (level === 2) return "font-size:18px;font-weight:bold;color:#1e3a8a;";
    if (level === 3) return "font-size:17px;font-weight:bold;color:#333333;";
    return "font-size:16px;font-weight:bold;color:#333333;";
  },

  // 强调：使用科技蓝突出，而非黑色
  strong: css(["font-weight:bold", "color:#1772b4"]),
  em: "font-style:italic;color:#666;",

  // 链接：经典蓝+下划线
  link: css(["color:#1772b4", "text-decoration:underline", "word-break:break-all"]),

  ul: css(["margin:0 0 20px 0", "padding-left:20px", "font-size:15px"]),
  ol: css(["margin:0 0 20px 0", "padding-left:20px", "font-size:15px"]),
  li: css(["margin:8px 0", "line-height:1.75", "color:#333333"]),
  listParagraph: makeListParagraphStyle({ fontSizePx: 15, lineHeight: 1.75, color: "#333333" }),
  listBullet: makeListBulletStyle(),

  // 引用：浅灰色背景+深色文字+左侧细蓝线
  blockquote: [
    "margin:0 0 20px 0",
    "padding:16px",
    "background-color:#f7f9fc",
    "border-left:4px solid #b3cdf2",
    "color:#555555",
    "font-size:15px",
    "border-radius:4px"
  ].join(";"),

  // 行内代码：浅红背景，模仿 Markdown 默认风格，与蓝色主题形成冷暖对比
  inlineCode: [
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:14px",
    "background-color:#fff1f0",
    "padding:2px 6px",
    "border-radius:3px",
    "color:#cf222e"
  ].join(";"),

  // 代码块：深色夜间模式，适合技术代码展示
  codeBlockWrapper: [
    "margin:20px 0",
    "padding:15px",
    "background-color:#f6f8fa", // GitHub Light
    "border:1px solid #d0d7de",
    "border-radius:6px",
    "overflow-x:auto"
  ].join(";"),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: [
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:13px",
    "color:#24292e"
  ].join(";"),

  image: css([
    "display:block",
    "margin:20px auto",
    "max-width:100%",
    "height:auto",
    "border-radius:6px",
    "box-shadow:0 2px 8px rgba(0,0,0,0.05)"
  ]),

  // 表格样式 - 科技蓝主题
  ...makeTableStyles({
    borderColor: "#b3cdf2",
    headerBg: "#eff6ff",
    headerColor: "#1e3a8a",
    cellColor: "#333333"
  }),

  // 代码高亮 - 浅色背景使用浅色方案
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};

// 色块15px，精致
export const WECHAT_LIGHT_THEME2: WeChatTheme = {
  // 核心变更：字号 15px，行高保持 1.7
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px", 
    "line-height:1.7",
    "color:#374151", // Cool Gray 700，比纯黑更有质感
    "text-align:left",
    "letter-spacing:0.5px"
  ].join(";"),

  // 段落：间距适中，颜色柔和
  paragraph: css(["margin:0 0 16px 0", "color:#374151", "font-size:15px", "text-align:left"]),

  headingBlock: (level) => {
    if (level === 1) {
      // H1：极简，依靠留白和字重，去除所有线条装饰
      return "margin:32px 0 20px 0;text-align:center;";
    }
    if (level === 2) {
      // H2：【关键设计】使用浅色背景块承载，全宽，圆角，无边框
      // 这种设计在 Notion 和 modern Blog 中非常流行，视觉负担低但区分度高
      return [
        "margin:32px 0 16px 0",
        "padding:10px 16px",
        "background-color:#e0e7ff", // 极浅的靛青色背景
        "border-radius:8px",
        "display:block" // 确保是块级
      ].join(";");
    }
    if (level === 3) {
      // H3：左侧微小的 padding，依靠文字本身颜色
      return "margin:20px 0 10px 0;padding-left:8px;";
    }
    return "margin:20px 0 10px 0;";
  },

  headingText: (level) => {
    if (level === 1) return "font-size:24px;font-weight:900;color:#111827;line-height:1.3;";
    // H2：文字使用深靛青色，与背景形成“同色系”高级感
    if (level === 2) return "font-size:17px;font-weight:800;color:#4338ca;"; 
    // H3：前面加个小点缀的效果通过 border-left 模拟不够好，这里直接用颜色区分
    if (level === 3) return "font-size:16px;font-weight:700;color:#4338ca;";
    return "font-size:15px;font-weight:700;color:#374151;";
  },

  // 强调：使用稍亮的靛青色，吸引注意力
  strong: css(["font-weight:700", "color:#4f46e5"]), 
  em: "font-style:italic;color:#6b7280;",

  // 链接：不使用下划线（显得乱），而是使用“文字色 + 底部虚线”或纯颜色
  // 调研发现：现代排版倾向于仅用颜色，或者 border-bottom: 1px dashed
  link: css([
    "color:#4f46e5",
    "text-decoration:none",
    "border-bottom:1px solid rgba(79, 70, 229, 0.3)",
    "font-weight:500"
  ]),

  ul: css(["margin:0 0 22px 0", "padding-left:22px"]),
  ol: css(["margin:0 0 22px 0", "padding-left:22px"]),
  li: css(["margin:6px 0", "line-height:1.75", "color:#374151", "font-size:15px"]),
  listParagraph: makeListParagraphStyle({ fontSizePx: 15, lineHeight: 1.75, color: "#374151" }),
  listBullet: makeListBulletStyle(),

  // 引用：现代风格喜欢“圆角卡片式”引用，深色文字，不再是灰秃秃的
  blockquote: [
    "margin:0 0 22px 0",
    "padding:16px 18px",
    "background-color:#f9fafb", // Cool Gray 50
    "border-radius:12px", // 大圆角
    "color:#4b5563",
    "font-size:15px",
    "border:1px solid #f3f4f6" // 极细的微边框增加精致度
  ].join(";"),

  // 行内代码：高饱和度的背景，制造“POP”的感觉
  inlineCode: [
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:13px",
    "background-color:#eff6ff", // 浅蓝背景
    "color:#2563eb", // 亮蓝文字
    "padding:3px 6px",
    "border-radius:6px",
    "font-weight:500"
  ].join(";"),

  // 代码块：浅色背景，Slate 风格
  codeBlockWrapper: [
    "margin:24px 0",
    "padding:18px",
    "background-color:#f8fafc", // Slate 50
    "border-radius:12px",
    "border:1px solid #e2e8f0",
    "box-shadow: 0 2px 4px rgba(0,0,0,0.05)"
  ].join(";"),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: [
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:13px",
    "color:#334155" // Slate 700
  ].join(";"),

  image: css([
    "display:block",
    "margin:24px auto",
    "max-width:100%",
    "height:auto",
    "border-radius:12px",
    "box-shadow:0 10px 15px -3px rgba(0, 0, 0, 0.05)"
  ]),

  // 表格样式 - 靛青卡片主题
  ...makeTableStyles({
    borderColor: "#c7d2fe",
    headerBg: "#e0e7ff",
    headerColor: "#4338ca",
    cellColor: "#374151"
  }),

  // 代码高亮 - 浅色背景使用浅色方案
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};

export const WECHAT_SWISS_GRID: WeChatTheme = {
  // 15px 是标准，配合 1.7 行高
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.7",
    "color:#1a1a1a", // 近乎纯黑，高对比度
    "text-align:left",
    "letter-spacing:0.02em" // 稍微增加字间距，增加呼吸感
  ].join(";"),

  paragraph: css(["margin:0 0 16px 0", "color:#333", "font-size:15px", "text-align:left"]),

  headingBlock: (level) => {
    if (level === 1) {
      // H1: 巨大的留白，无需装饰
      return "margin:32px 0 20px 0;text-align:left;";
    }
    if (level === 2) {
      // H2: 【去色块化】彻底移除背景。
      // 使用“顶部分割线 + Padding-top”来创造“新章节”的心理暗示
      return [
        "margin:36px 0 16px 0",
        "padding-top:16px",
        "border-top:1px solid #e5e5e5", // 极细的银线
        "display:block"
      ].join(";");
    }
    if (level === 3) {
      return "margin:24px 0 12px 0;";
    }
    return "margin:20px 0 10px 0;";
  },

  headingText: (level) => {
    // 依靠极粗的字重（900）和字间距紧缩（-0.5px）来体现现代感
    if (level === 1) return "font-size:26px;font-weight:900;color:#000;letter-spacing:-0.5px;line-height:1.2;";
    // H2 也是纯文字，但字号够大，足够压得住场子
    if (level === 2) return "font-size:20px;font-weight:800;color:#000;letter-spacing:-0.3px;";
    if (level === 3) return "font-size:16px;font-weight:700;color:#000;";
    return "font-size:15px;font-weight:700;color:#1a1a1a;";
  },

  strong: "font-weight:700;color:#000;border-bottom:2px solid #000;", // 强调也用线条，不用颜色
  em: "font-style:italic;color:#666;", // 对齐公众号默认字体，不单独指定衬线体

  link: "color:#1a1a1a;text-decoration:none;border-bottom:1px solid #999;transition:border-color 0.2s;",

  ul: css(["margin:0 0 24px 0", "padding-left:0", "list-style-position:inside"]), // 列表内缩，更像杂志
  ol: css(["margin:0 0 24px 0", "padding-left:0", "list-style-position:inside"]),
  li: css(["margin:8px 0", "line-height:1.8", "color:#333"]),
  listParagraph: makeListParagraphStyle({ fontSizePx: 15, lineHeight: 1.8, color: "#333", baseIndentPx: 18 }),
  listBullet: makeListBulletStyle(),

  // 引用：左侧极粗黑线，无背景
  blockquote: [
    "margin:0 0 24px 0",
    "padding:4px 0 4px 20px",
    "border-left:4px solid #000",
    "color:#333333", // 加深颜色，确保在白色背景上可见
    "font-size:15px",
    "font-style:italic"
  ].join(";"),

  inlineCode: [
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:13px",
    "background-color:#f1f1f1", // 极浅灰
    "padding:2px 6px",
    "border-radius:2px", // 直角微圆，更硬朗
    "color:#000"
  ].join(";"),

  codeBlockWrapper: [
    "margin:24px 0",
    "padding:20px",
    "background-color:#f8f8f8", // 浅灰背景，像纸张一样
    "border:1px solid #eee",
    "border-radius:0" // 直角，拒绝圆润
  ].join(";"),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: css([`font-family:${WECHAT_CODE_FONT_FAMILY}`, "font-size:13px", "color:#333"]),

  image: css(["display:block", "margin:32px auto", "max-width:100%", "height:auto", "filter:grayscale(20%)"]), // 图片微降饱和度

  // 表格样式 - 瑞士网格极简风
  ...makeTableStyles({
    borderColor: "#1a1a1a",
    headerBg: "#f8f8f8",
    headerColor: "#000000",
    cellColor: "#333333"
  }),

  // 代码高亮 - 浅色背景使用浅色方案
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};

export const WECHAT_LIGHT_THEME: WeChatTheme = {
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.6",
    "color:#1f2937", // 更加中性的深灰色，减少蓝调，缓解视觉疲劳
    "text-align:left",
    "letter-spacing:0.5px"
  ].join(";"),

  paragraph: css(["margin:0 0 16px 0", "color:#1f2937", "font-size:15px", "text-align:left"]),

  headingBlock: (level) => {
    // 无论是 H1 还是 H2，都不要全宽背景色
    if (level === 1) return "margin:30px 0 20px 0;text-align:center;";
    if (level === 2) return "margin:30px 0 15px 0;display:block;"; // 保持块级，为了间距
    return "margin:20px 0 10px 0;";
  },

  headingText: (level) => {
    if (level === 1) return "font-size:24px;font-weight:900;color:#111827;";
    
    // H2：【核心技法】使用 background-image 模拟“荧光笔半高亮”效果
    // 这种效果不占空间，视觉轻盈，是目前 Medium/Substack 上非常流行的样式
    if (level === 2) {
      return [
        "font-size:18px",
        "font-weight:800",
        "color:#111827",
        "display:inline-block", // 必须是 inline-block 才能撑开背景
        // 下面这行是魔法：线性渐变，从透明到透明，只在底部 40% 显示一种淡彩
        "background:linear-gradient(180deg, transparent 60%, rgba(139, 92, 246, 0.2) 60%)", // 降低紫色饱和度
        "padding:0 4px", // 稍微给点左右呼吸
        "border-radius:2px"
      ].join(";");
    }
    
    if (level === 3) return "font-size:16px;font-weight:700;color:#5b21b6;margin-left:4px;"; // 稍微调深紫色
    return "font-size:15px;font-weight:700;";
  },

  // 强调：使用紫色系的渐变文字（如果兼容性允许）或深紫色
  strong: css(["font-weight:700", "color:#5b21b6"]), // 更加沉稳的深紫色
  em: "font-style:italic;color:#6b7280;",

  // 链接：虚线底边，更现代
  link: css(["color:#7c3aed", "text-decoration:none", "border-bottom:1px dashed #7c3aed"]),

  ul: css(["margin:0 0 22px 0", "padding-left:20px"]),
  ol: css(["margin:0 0 22px 0", "padding-left:20px"]),
  li: css(["margin:6px 0", "line-height:1.75", "color:#374151"]),
  listParagraph: makeListParagraphStyle({ fontSizePx: 15, lineHeight: 1.75, color: "#374151" }),
  listBullet: makeListBulletStyle(),

  // 引用：渐变边框
  blockquote: [
    "margin:0 0 22px 0",
    "padding:16px",
    "background-color:#fbfbfe", // 极淡的紫白
    "border-left:3px solid #8b5cf6", // 亮紫色
    "color:#555",
    "font-size:15px",
    "border-radius:0 8px 8px 0"
  ].join(";"),

  inlineCode: [
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:13px",
    "background-color:#f3e8ff", // 浅紫背景
    "color:#6b21a8", // 深紫字
    "padding:2px 6px",
    "border-radius:4px"
  ].join(";"),

  codeBlockWrapper: [
    "margin:24px 0",
    "padding:18px",
    "background-color:#ffffff", // Pure White
    "border:1px solid #e9d5ff",
    "border-radius:12px"
  ].join(";"),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: css([`font-family:${WECHAT_CODE_FONT_FAMILY}`, "font-size:13px", "color:#581c87"]),

  image: css([
    "display:block",
    "margin:24px auto",
    "max-width:100%",
    "height:auto",
    "border-radius:12px",
    "box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)"
  ]),

  // 表格样式 - 紫色高亮主题
  ...makeTableStyles({
    borderColor: "#c4b5fd",
    headerBg: "#f5f3ff",
    headerColor: "#5b21b6",
    cellColor: "#374151"
  }),

  // 代码高亮 - 浅色背景使用浅色方案
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};

export const WECHAT_NEO_POP: WeChatTheme = {
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.7",
    "color:#000000", // 纯黑文字
    "text-align:left",
    "letter-spacing:0.5px"
  ].join(";"),

  paragraph: css(["margin:0 0 16px 0", "color:#000000", "font-size:15px", "text-align:left"]),

  headingBlock: (level) => {
    if (level === 1) return css(["margin:32px 0 24px 0", "text-align:center"]);
    if (level === 2) {
      // H2: 黑边框 + 硬阴影（无模糊）
      return css([
        "margin:32px 0 18px 0",
        "padding:10px 16px",
        "background-color:#FFDE00", // 亮黄 (Cyber Yellow)
        "border:2px solid #000000",
        "box-shadow:4px 4px 0px #000000", // 硬阴影
        "display:inline-block", // 这种风格通常不做通栏
        "transform:rotate(-1deg)" // 微信可能过滤，但保留作为风格特征
      ]);
    }
    return css(["margin:20px 0 10px 0"]);
  },

  headingText: (level) => {
    if (level === 1) return css(["font-size:28px", "font-weight:900", "color:#000", "text-shadow:2px 2px 0px #ddd"]);
    if (level === 2) return css(["font-size:18px", "font-weight:900", "color:#000"]);
    if (level === 3) return css(["font-size:16px", "font-weight:800", "background:#000", "color:#fff", "padding:2px 6px"]);
    return css(["font-size:16px", "font-weight:700"]);
  },

  // 亮粉色背景强调（注意：不重复写 color）
  strong: css(["font-weight:800", "background-color:#FF69B4", "padding:0 4px", "color:#fff"]),
  em: css(["font-style:italic", "border-bottom:2px solid #000"]),

  link: css(["color:#000", "text-decoration:underline", "font-weight:700", "background-color:#00FFFF", "padding:0 2px"]),

  ul: css(["margin:0 0 20px 0", "padding-left:20px"]),
  ol: css(["margin:0 0 20px 0", "padding-left:20px"]),
  li: css(["margin:8px 0", "line-height:1.75", "font-weight:500"]),
  listParagraph: makeListParagraphStyle({
    fontSizePx: 15,
    lineHeight: 1.75,
    color: "#000000",
    baseIndentPx: 22,
    indentPerLevelPx: 18,
    orderedHangPx: 30,
    unorderedHangPx: 22
  }),
  // NeoPop：列表符号更“硬朗”，用纯黑强调
  listBullet: css(["color:#000000", "font-weight:900"]),

  blockquote: css([
    "margin:0 0 24px 0",
    "padding:16px",
    "background-color:#fff",
    "border:2px solid #000",
    "box-shadow:4px 4px 0px #000",
    "color:#000",
    "font-size:15px",
    "font-weight:500"
  ]),

  inlineCode: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:14px",
    "background-color:#000",
    "color:#00FF00", // 黑客绿
    "padding:2px 6px",
    "border:1px solid #000"
  ]),

  codeBlockWrapper: css([
    "margin:24px 0",
    "padding:16px",
    "background-color:#fff",
    "border:2px solid #000",
    "box-shadow:6px 6px 0px #ccc"
  ]),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: css([`font-family:${WECHAT_CODE_FONT_FAMILY}`, "font-size:13px", "color:#000"]),

  image: css([
    "display:block",
    "margin:24px auto",
    "max-width:100%",
    "height:auto",
    "border:2px solid #000",
    "box-shadow:4px 4px 0px #000"
  ]),

  // 表格样式 - 霓虹波普主题
  ...makeTableStyles({
    borderColor: "#000000",
    headerBg: "#FFDE00",
    headerColor: "#000000",
    cellColor: "#000000"
  }),

  // 代码高亮 - 霓虹风格 (改为浅色适配)
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};

export const WECHAT_MARVEL_HERO: WeChatTheme = {
  // 基础：保持 15px，纯黑文字，极致的高对比度
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.7",
    "color:#000000",
    "text-align:left",
    "letter-spacing:0.5px"
  ].join(";"),

  paragraph: css(["margin:0 0 16px 0", "color:#111111", "font-size:15px", "text-align:left"]),

  headingBlock: (level) => {
    if (level === 1) {
      // H1: 居中布局
      return css(["margin:32px 0 24px 0", "text-align:center"]);
    }
    if (level === 2) {
      // H2: 弹性布局，为斜切按钮做准备
      return css(["margin:36px 0 18px 0", "display:flex", "align-items:center"]);
    }
    // H3 & Default
    return css(["margin:24px 0 12px 0"]);
  },

  headingText: (level) => {
    if (level === 1) {
      // H1: 红黑文字渐变蒙版
      return css([
        "font-size:28px",
        "font-weight:900",
        "background-image:linear-gradient(135deg, #000 0%, #EC1D24 100%)",
        "-webkit-background-clip:text",
        "color:transparent",
        "text-transform:uppercase",
        "letter-spacing:-1px",
        "line-height:1.2"
      ]);
    }
    if (level === 2) {
      // H2: 斜切红色能量条 + 硬黑阴影
      return css([
        "display:inline-block",
        "font-size:18px",
        "font-weight:900",
        "color:#FFF",
        "background:linear-gradient(90deg, #EC1D24, #B91C1C)",
        "padding:6px 18px",
        "transform:skewX(-10deg)",
        "box-shadow:4px 4px 0px #000",
        "border:2px solid #000",
        "letter-spacing:1px"
      ]);
    }
    if (level === 3) {
      // H3: 底部粗黑线条
      return css([
        "font-size:16px",
        "font-weight:800",
        "color:#000",
        "border-bottom:3px solid #EC1D24",
        "display:inline-block",
        "padding-bottom:2px"
      ]);
    }
    return css(["font-size:15px", "font-weight:700"]);
  },

  // 强调：黑底白字 + 斜切 + 拟声词感
  strong: css([
    "font-weight:900",
    "color:#fff",
    "background-color:#000",
    "padding:0 4px",
    "margin:0 2px",
    "transform:skewX(-10deg)"
  ]),

  em: css(["font-style:italic", "color:#EC1D24", "font-weight:bold"]),

  // 链接：高亮科技蓝 + 斜切背景
  link: css([
    "color:#fff",
    "background:#007AFF",
    "text-decoration:none",
    "padding:0 4px",
    "font-weight:bold",
    "box-shadow:2px 2px 0px #000"
  ]),

  ul: css(["margin:0 0 24px 0", "padding-left:20px"]),
  ol: css(["margin:0 0 24px 0", "padding-left:20px"]),
  li: css(["margin:8px 0", "line-height:1.75", "font-weight:500"]),
  
  // 列表样式生成器
  listParagraph: makeListParagraphStyle({
    fontSizePx: 15,
    lineHeight: 1.75,
    color: "#111111",
    baseIndentPx: 20,
    indentPerLevelPx: 20,
    orderedHangPx: 28,
    unorderedHangPx: 20
  }),
  // 列表符号：为了匹配 SNAP 风格，使用红色粗体
  listBullet: css(["color:#EC1D24", "font-weight:900"]),

  // 引用：Wolverine Yellow + 巨大硬阴影
  blockquote: css([
    "margin:0 0 24px 0",
    "padding:20px",
    "background-color:#FDE047",
    "border:2px solid #000",
    "box-shadow:6px 6px 0px #000",
    "color:#000",
    "font-size:15px",
    "font-weight:700",
    "position:relative"
  ]),

  // 行内代码：白底红字 + 黑框
  inlineCode: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:13px",
    "background-color:#fff",
    "color:#EC1D24",
    "padding:2px 6px",
    "border:1px solid #000",
    "box-shadow:2px 2px 0px #000",
    "font-weight:bold"
  ]),

  // 代码块：暗黑反派风格 -> 改为白底红框
  codeBlockWrapper: css([
    "margin:24px 0",
    "padding:16px",
    "background-color:#fff",
    "border:2px solid #EC1D24",
    "box-shadow:8px 8px 0px rgba(236, 29, 36, 0.2)"
  ]),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: css([`font-family:${WECHAT_CODE_FONT_FAMILY}`, "font-size:13px", "color:#000"]),

  image: css([
    "display:block",
    "margin:30px auto",
    "max-width:100%",
    "height:auto",
    "border:3px solid #000",
    "box-shadow:8px 8px 0px #EC1D24"
  ]),

  // 表格样式 - 漫威英雄主题
  ...makeTableStyles({
    borderColor: "#000000",
    headerBg: "#EC1D24",
    headerColor: "#ffffff",
    cellColor: "#111111"
  }),

  // 代码高亮 - 霓虹风格 -> 浅色
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};

export const WECHAT_WARM_NATURE: WeChatTheme = {
  // 基础：使用暖灰色文字，字号 15px，行高适中
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.7",
    "color:#44403c", // Warm Stone 700
    "text-align:left",
    "letter-spacing:0.05em"
  ].join(";"),

  paragraph: css(["margin:0 0 20px 0", "color:#44403c", "font-size:15px", "text-align:justify"]),

  headingBlock: (level) => {
    if (level === 1) {
      // H1: 极简居中，底部带有微小的装饰性元素
      return css(["margin:36px 0 24px 0", "text-align:center"]);
    }
    if (level === 2) {
      // H2: 胶囊式标题，不再通栏，而是像一个精致的标签
      return css([
        "margin:32px 0 20px 0",
        "display:flex",
        "align-items:center"
      ]);
    }
    // H3: 简单的左对齐
    return css(["margin:24px 0 12px 0"]);
  },

  headingText: (level) => {
    if (level === 1) {
      return css([
        "font-size:26px",
        "font-weight:800",
        "color:#3f6212", // 苔藓绿
        "letter-spacing:-0.5px",
        "border-bottom:2px solid #d9f99d", // 嫩绿下划线
        "padding-bottom:8px",
        "display:inline-block"
      ]);
    }
    if (level === 2) {
      return css([
        "font-size:18px",
        "font-weight:700",
        "color:#1a2e05", // 深绿
        "background-color:#ecfccb", // 极浅的莱姆绿背景
        "padding:6px 16px",
        "border-radius:20px", // 胶囊圆角
        "border:1px solid #d9f99d" // 微边框提升精致度
      ]);
    }
    if (level === 3) {
      return css([
        "font-size:17px",
        "font-weight:700",
        "color:#3f6212",
        "padding-left:8px",
        "border-left:4px solid #84cc16" // 亮绿短线
      ]);
    }
    return css(["font-size:16px", "font-weight:700", "color:#44403c"]);
  },

  // 强调：模拟“马克笔”涂抹效果（半高亮背景），而非改变字色
  strong: css([
    "font-weight:700",
    "color:#1c1917",
    "background:linear-gradient(180deg, transparent 60%, #fde68a 60%)", // 暖黄马克笔笔触
    "padding:0 2px"
  ]),

  // 斜体：使用衬线体风格，增加书卷气
  em: css([
    "font-family:Georgia, serif", 
    "font-style:italic", 
    "color:#78716c",
    "margin-right:2px"
  ]),

  // 链接：森林绿+虚线，低调优雅
  link: css([
    "color:#4d7c0f",
    "text-decoration:none",
    "border-bottom:1px dashed #4d7c0f",
    "padding-bottom:1px"
  ]),

  ul: css(["margin:0 0 28px 0", "padding-left:20px"]),
  ol: css(["margin:0 0 28px 0", "padding-left:20px"]),
  li: css(["margin:10px 0", "line-height:1.8", "color:#44403c"]),
  
  listParagraph: makeListParagraphStyle({ 
    fontSizePx: 16, 
    lineHeight: 1.9, 
    color: "#44403c",
    baseIndentPx: 20
  }),
  
  // 列表符号：使用柔和的绿色圆点
  listBullet: css(["color:#84cc16", "font-weight:900", "font-size:1.2em"]),

  // 引用：卡片式设计，米色背景，类似便签纸
  blockquote: css([
    "margin:0 0 28px 0",
    "padding:20px 24px",
    "background-color:#fafaf9", // 暖白/石色背景
    "border-radius:12px",
    "color:#57534e",
    "font-size:15px", // 引用字号稍小
    "line-height:1.7",
    "border:1px solid #e7e5e4", // 极细的边框
    "position:relative"
  ]),

  // 行内代码：石色背景，深褐文字，像打印纸上的打字机字
  inlineCode: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:14px",
    "background-color:#f5f5f4",
    "color:#78350f", // 暖褐色
    "padding:3px 6px",
    "border-radius:6px",
    "border:1px solid #e7e5e4"
  ]),

  // 代码块：使用“Solarized Light”风格的暖色系，护眼
  codeBlockWrapper: css([
    "margin:28px 0",
    "padding:16px",
    "background-color:#fdf6e3", // Solarized Base3
    "border-radius:8px",
    "border:1px solid #eee8d5"
  ]),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`, 
    "font-size:13px", 
    "color:#657b83" // Solarized Content
  ]),

  // 图片：大圆角，带有极其微弱的暖色阴影
  image: css([
    "display:block",
    "margin:32px auto",
    "max-width:100%",
    "height:auto",
    "border-radius:16px",
    "box-shadow:0 10px 20px -5px rgba(120, 113, 108, 0.15)"
  ]),

  // 表格样式 - 自然森系主题
  ...makeTableStyles({
    borderColor: "#d9f99d",
    headerBg: "#ecfccb",
    headerColor: "#3f6212",
    cellColor: "#44403c"
  }),

  // 代码高亮 - 暖色方案
  codeHighlight: CODE_HIGHLIGHT_WARM
};
export const WECHAT_PERSONA5: WeChatTheme = {
  // 基础：使用高对比度的黑字，字间距收紧，模拟紧凑的日式排版
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.7",
    "color:#000000",
    "text-align:left",
    "letter-spacing:0px", // P5 风格通常紧凑
    "background-color:#fff"
  ].join(";"),

  paragraph: css(["margin:0 0 16px 0", "color:#000000", "font-size:15px", "font-weight:500", "text-align:left"]),

  headingBlock: (level) => {
    if (level === 1) {
      // H1: 模拟“预告信 (Calling Card)”的 Logo 风格
      // 强烈的旋转 + 红黑撞色
      return css([
        "margin:36px 0 24px 0",
        "text-align:center",
        "transform:rotate(-3deg)" // 整体微旋，打破平衡
      ]);
    }
    if (level === 2) {
      // H2: 模拟“总攻击 (All-Out Attack)”时的切入画面
      // 极致的倾斜黑条 + 红色阴影
      return css([
        "margin:40px 0 20px 0",
        "display:block",
        "transform:skewX(-10deg)", // 经典的 P5 倾斜
        "border-bottom:3px solid #E60012"
      ]);
    }
    if (level === 3) {
      return css(["margin:24px 0 12px 0", "display:inline-block", "transform:skewX(-10deg)"]);
    }
    return css(["margin:20px 0 10px 0"]);
  },

  headingText: (level) => {
    if (level === 1) {
      // H1 文字：黑底白字 + 红边，像剪报一样
      return css([
        "font-size:26px",
        "font-weight:900",
        "color:#fff",
        "background-color:#000",
        "padding:8px 16px",
        "border:3px solid #E60012",
        "box-shadow:6px 6px 0px #E60012", // 红色硬阴影
        "display:inline-block"
      ]);
    }
    if (level === 2) {
      // H2 文字：黑底白字，充满力量感
      return css([
        "font-size:20px",
        "font-weight:900",
        "color:#fff",
        "background-color:#000",
        "padding:4px 20px",
        "display:inline-block",
        "letter-spacing:1px"
      ]);
    }
    if (level === 3) {
      // H3：红字 + 粗体
      return css([
        "font-size:17px",
        "font-weight:900",
        "color:#E60012",
        "background:#000",
        "color:#fff", // 反色：黑底白字更 P5
        "padding:2px 8px",
        "border-left:4px solid #E60012"
      ]);
    }
    return css(["font-size:15px", "font-weight:700"]);
  },

  // 强调：模拟勒索信中的剪贴字，随机感的倾斜（这里固定为负倾斜）
  strong: css([
    "font-weight:900",
    "color:#fff !important",
    "background-color:#E60012", // 红色背景
    "padding:0 6px",
    "transform:rotate(-2deg)", // 每一个重点都是不安分的
    "margin:0 2px",
    "border-radius:2px" // 确保背景色正确显示
  ]),

  em: css(["font-style:normal", "font-weight:bold", "color:#000", "text-decoration:underline", "text-decoration-color:#E60012", "text-decoration-thickness:3px"]),

  // 链接：不像传统的链接，更像是 UI 里的选中项
  link: css([
    "color:#000",
    "font-weight:900",
    "text-decoration:none",
    "background:linear-gradient(180deg, transparent 60%, #E60012 60%)", // 红色下半部高亮
    "padding:0 2px"
  ]),

  ul: css(["margin:0 0 24px 0", "padding-left:20px"]),
  ol: css(["margin:0 0 24px 0", "padding-left:20px"]),
  li: css(["margin:8px 0", "line-height:1.75", "font-weight:700", "color:#222"]),
  
  listParagraph: makeListParagraphStyle({
    fontSizePx: 15,
    lineHeight: 1.75,
    color: "#000000",
    baseIndentPx: 20,
    indentPerLevelPx: 20,
    orderedHangPx: 28,
    unorderedHangPx: 20
  }),
  // 列表符号：著名的 P5 星星 (Star)，或者简单的黑块
  // 由于微信限制，这里用特殊的 Unicode 星星，并加红
  listBullet: css(["color:#E60012", "font-size:120%", "line-height:1"]), 

  // 引用：模拟游戏内的 IM (SNS) 聊天气泡
  blockquote: css([
    "margin:0 0 24px 0",
    "padding:16px",
    "background-color:#000 !important", // 纯黑背景，使用!important确保应用
    "color:#fff !important", // 白字，使用!important确保应用
    "border:2px solid #E60012", // 红框
    "transform:skewX(-5deg)", // 整体微斜
    "box-shadow:5px 5px 0px rgba(0,0,0,0.2)",
    "font-weight:bold"
  ]),

  // 行内代码：白底红字 + 黑色粗框
  inlineCode: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:14px",
    "color:#E60012",
    "background-color:#fff",
    "border:2px solid #000",
    "padding:2px 6px",
    "font-weight:bold",
    "transform:skewX(-5deg)" // 代码也要斜！
  ]),

  // 代码块：印象空间 (Mementos) 风格 - 改为白底红框
  codeBlockWrapper: css([
    "margin:24px 0",
    "padding:20px",
    "background-color:#fff",
    "border:2px solid #E60012",
    "transform:rotate(1deg)", // 甚至代码块都是歪的
    "position:relative"
  ]),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: css([`font-family:${WECHAT_CODE_FONT_FAMILY}`, "font-size:13px", "color:#000", "font-weight:bold"]),

  image: css([
    "display:block",
    "margin:30px auto",
    "max-width:100%",
    "height:auto",
    "border:4px solid #000", // 粗黑边框
    "box-shadow:8px 8px 0px #E60012", // 红色硬投影
    "transform:rotate(-1deg)" // 照片微斜，像扔在桌上
  ]),

  // 表格样式 - Persona 5 主题
  ...makeTableStyles({
    borderColor: "#000000",
    headerBg: "#E60012",
    headerColor: "#ffffff",
    cellColor: "#000000"
  }),

  // 代码高亮 - 霓虹风格 -> 浅色
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};

export const WECHAT_VITALITY_ORANGE: WeChatTheme = {
  // 根节点：使用深暖灰文字，15px 字号，行高适中
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.75",
    "color:#292524", // Warm Grey 800
    "text-align:left",
    "letter-spacing:0.04em"
  ].join(";"),

  paragraph: css(["margin:0 0 18px 0", "color:#292524", "font-size:15px", "text-align:justify"]),

  headingBlock: (level) => {
    if (level === 1) {
      // H1: 居中，留白充足
      return css(["margin:40px 0 24px 0", "text-align:center"]);
    }
    if (level === 2) {
      // H2: 左侧装饰，不仅是块，还带有向右延伸的视觉引导
      return css([
        "margin:32px 0 18px 0",
        "padding:8px 16px",
        "background:linear-gradient(90deg, #fff7ed 0%, rgba(255,247,237,0) 100%)", // 渐变淡出背景
        "border-left:5px solid #f97316", // 粗橙色线条
        "display:block"
      ]);
    }
    // H3: 简单的底部线条
    return css(["margin:24px 0 12px 0", "padding-bottom:6px", "border-bottom:1px solid #fed7aa"]);
  },

  headingText: (level) => {
    if (level === 1) {
      // H1: 橙红渐变文字 (Webkit clip)
      return css([
        "font-size:26px",
        "font-weight:900",
        "background-image:linear-gradient(135deg, #f97316 0%, #db2777 100%)", // 橙到玫红的渐变
        "-webkit-background-clip:text",
        "color:transparent", // 兼容性回退由微信处理，通常在编辑器里能看到效果
        "letter-spacing:-0.5px",
        "display:inline-block" // 必须inline-block才能裁剪背景
      ]);
    }
    if (level === 2) {
      // H2: 深橙色文字
      return css([
        "font-size:18px",
        "font-weight:800",
        "color:#c2410c", // Dark Orange
        "letter-spacing:0.5px"
      ]);
    }
    if (level === 3) {
      return css([
        "font-size:17px",
        "font-weight:700",
        "color:#ea580c"
      ]);
    }
    return css(["font-size:16px", "font-weight:700"]);
  },

  // 强调：醒目的底部粗线，类似荧光笔划过
  strong: css([
    "font-weight:700",
    "color:#c2410c",
    "background:linear-gradient(to top, #ffedd5 40%, transparent 40%)", // 下半部分淡橙色高亮
    "padding:0 2px"
  ]),

  // 斜体：橙色，带一点手写感
  em: css(["font-style:italic", "color:#f97316", "font-weight:600", "margin:0 2px"]),

  // 链接：橙色文字 + 橙色虚线
  link: css([
    "color:#ea580c",
    "text-decoration:none",
    "border-bottom:1px dashed #f97316",
    "font-weight:700"
  ]),

  ul: css(["margin:0 0 26px 0", "padding-left:16px"]),
  ol: css(["margin:0 0 26px 0", "padding-left:16px"]),
  li: css(["margin:8px 0", "line-height:1.85", "color:#292524"]),

  listParagraph: makeListParagraphStyle({ 
    fontSizePx: 16, 
    lineHeight: 1.85, 
    color: "#292524",
    baseIndentPx: 16 
  }),

  // 列表符号：实心圆点换成醒目的 emoji 或 粗体符号，这里用 CSS 颜色控制
  listBullet: css(["color:#f97316", "font-weight:900", "font-size:1.2em"]),

  // 引用：左侧橙线 + 极淡橙背景，圆角
  blockquote: css([
    "margin:0 0 26px 0",
    "padding:20px",
    "background-color:#fff7ed", // Very light orange
    "border-left:4px solid #f97316",
    "border-radius:0 12px 12px 0", // 只有右侧圆角
    "color:#431407", // Very dark orange/brown
    "font-size:15px"
  ]),

  // 行内代码：波普风格，白底橙字橙边框
  inlineCode: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:14px",
    "color:#ea580c",
    "background-color:#fff",
    "padding:2px 6px",
    "border:1px solid #fdba74", // Orange 300
    "border-radius:4px",
    "font-weight:600"
  ]),

  // 代码块：浅色背景
  codeBlockWrapper: css([
    "margin:28px 0",
    "padding:18px",
    "background-color:#fff7ed", // Orange 50
    "border-radius:12px",
    "border-top:4px solid #f97316" // 顶部橙条装饰
  ]),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`, 
    "font-size:13px", 
    "color:#431407" // Dark Orange Brown
  ]),

  // 图片：简单干练，带一点投影
  image: css([
    "display:block",
    "margin:30px auto",
    "max-width:100%",
    "height:auto",
    "border-radius:8px",
    "box-shadow:0 8px 16px -4px rgba(249, 115, 22, 0.2)" // 橙色系投影
  ]),

  // 表格样式 - 活力橙主题
  ...makeTableStyles({
    borderColor: "#fdba74",
    headerBg: "#fff7ed",
    headerColor: "#c2410c",
    cellColor: "#292524"
  }),

  // 代码高亮 - 暖色方案
  // 代码高亮 - 暖色方案
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};

export const WECHAT_PURE_GLASS: WeChatTheme = {
  // 根节点：使用更现代的无衬线体配置，字号 15px
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.7",
    "color:#1F2937", 
    "text-align:left",
    "letter-spacing:0.04em"
  ].join(";"),

  paragraph: css(["margin:0 0 16px 0", "color:#374151", "font-size:15px", "text-align:justify"]),

  headingBlock: (level) => {
    if (level === 1) {
      // H1: 居中，底部大留白
      return css(["margin:32px 0 24px 0", "text-align:center"]);
    }
    if (level === 2) {
      // H2: 【惊喜设计】悬浮胶囊。
      // 使用 table 布局或者 fit-content (兼容性起见用 table/inline-block + 居中)
      // 这是一个完全居中的、带有投影的“按钮式”标题
      return css([
        "margin:32px auto 20px auto", // 上下留白，左右 auto 居中
        "display:table", // 关键：让背景色只包裹文字宽度
        "padding:6px 20px",
        "background-color:#F2FBF6", // 极淡的薄荷绿背景
        "border-radius:50px", // 胶囊圆角
        "box-shadow:0 6px 16px -4px rgba(7, 193, 96, 0.15)", // 绿色弥散投影
        "border:1px solid rgba(7, 193, 96, 0.1)" // 极细微边框
      ]);
    }
    // H3: 简约左对齐，前面加个小绿点
    return css(["margin:24px 0 12px 0", "display:flex", "align-items:center"]);
  },

  headingText: (level) => {
    if (level === 1) {
      // H1: 黑色文字，底部发光
      return css([
        "font-size:26px",
        "font-weight:900",
        "color:#111827",
        // 使用 text-shadow 模拟底部绿色光晕，而不是下划线
        "text-shadow:0 4px 10px rgba(7, 193, 96, 0.3)", 
        "letter-spacing:-0.5px"
      ]);
    }
    if (level === 2) {
      // H2: 微信绿文字，稍微加宽字间距
      return css([
        "font-size:17px",
        "font-weight:800",
        "color:#07C160", // 品牌色
        "letter-spacing:1px"
      ]);
    }
    if (level === 3) {
      // H3: 前面加一个实心圆点作为装饰，不用 border-left
      return css([
        "font-size:17px",
        "font-weight:700",
        "color:#1F2937",
        // 使用伪元素很难内联，所以这里我们通过::before的模拟（文字本身）
        // 或者直接让 headingBlock 负责结构，这里只负责字。
        // 由于 H3 block 是 flex，我们在 markdown 渲染时无法插入 icon，
        // 只能依靠 headingText 样式。简单的做法是纯文字。
        "border-bottom:2px solid #F2FBF6",
        "padding-bottom:4px"
      ]);
    }
    return css(["font-size:16px", "font-weight:700"]);
  },

  // 强调：不改变字色，而是加“绿色底纹”，像选中状态
  strong: css([
    "font-weight:700",
    "color:#000",
    "background-color:rgba(7, 193, 96, 0.15)", // 15% 透明度的绿
    "padding:2px 4px",
    "border-radius:4px"
  ]),

  // 斜体：绿色，衬线体
  em: css(["font-style:italic", "color:#07C160", "font-family:Georgia"]),

  // 链接：微信绿文字，无下划线，有背景悬浮感
  link: css([
    "color:#07C160",
    "text-decoration:none",
    "font-weight:700",
    "border-bottom:1px solid rgba(7, 193, 96, 0.3)"
  ]),

  ul: css(["margin:0 0 24px 0", "padding-left:16px"]),
  ol: css(["margin:0 0 24px 0", "padding-left:16px"]),
  li: css(["margin:8px 0", "line-height:1.8", "color:#374151"]),

  listParagraph: makeListParagraphStyle({ 
    fontSizePx: 16, 
    lineHeight: 1.8, 
    color: "#374151",
    baseIndentPx: 16
  }),
  
  // 列表符号：微信绿实心圆
  listBullet: css(["color:#07C160", "font-size:1.4em", "line-height:1"]),

  // 引用：【惊喜设计】微信聊天气泡风格
  blockquote: css([
    "margin:0 0 24px 0",
    "padding:16px 20px",
    "background-color:#F2FBF6", // 气泡绿
    "border-radius:12px",
    "color:#065f32", // 深绿色文字
    "border:none", // 去除所有边框
    "position:relative",
    "font-size:15px"
  ]),

  // 行内代码：深色背景 + 亮绿文字 (黑客风格)
  inlineCode: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:14px",
    "background-color:#1c1c1e", // 纯黑
    "color:#07C160", // 终端绿
    "padding:2px 6px",
    "border-radius:4px",
    "font-weight:600"
  ]),

  // 代码块：浅色薄荷绿背景
  codeBlockWrapper: css([
    "margin:28px 0",
    "padding:16px",
    "background-color:#F2FBF6",
    "border-radius:10px",
    "border:1px solid rgba(7, 193, 96, 0.1)",
    "box-shadow:0 10px 20px -5px rgba(7, 193, 96, 0.05)"
  ]),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`, 
    "font-size:13px", 
    "color:#064e3b" // Dark Green
  ]),

  // 图片：圆角 + 柔和投影
  image: css([
    "display:block",
    "margin:30px auto",
    "max-width:100%",
    "height:auto",
    "border-radius:12px",
    "box-shadow:0 8px 16px rgba(0,0,0,0.08)"
  ]),

  // 表格样式 - 原生微光主题
  ...makeTableStyles({
    borderColor: "#d1d5db",
    headerBg: "#f9fafb",
    headerColor: "#1f2937",
    cellColor: "#374151"
  }),

  // 代码高亮 - 深色方案
  // 代码高亮 - 浅色方案
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};

export const WECHAT_MODERN_COBALT: WeChatTheme = {
  // 根节点：使用中性深灰调的文字，字号 15px，行高适中
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.75",
    "color:#1f2937", // 更加中性的深灰色，减少视觉负担
    "text-align:left",
    "letter-spacing:0.03em"
  ].join(";"),

  paragraph: css(["margin:0 0 18px 0", "color:#374151", "font-size:15px", "text-align:justify"]),

  headingBlock: (level) => {
    if (level === 1) {
      // H1: 极简居中，底部有一条短而精的蓝线
      return css(["margin:40px 0 28px 0", "text-align:center"]);
    }
    if (level === 2) {
      // H2: 弹性布局，左侧几何方块 + 文字
      return css([
        "margin:32px 0 20px 0",
        "display:flex",
        "align-items:center" // 垂直居中
      ]);
    }
    return css(["margin:24px 0 12px 0"]);
  },

  headingText: (level) => {
    if (level === 1) {
      return css([
        "font-size:26px",
        "font-weight:800",
        "color:#111827",
        "display:inline-block",
        "border-bottom:3px solid #1e40af", // 稍微调深蓝色
        "padding-bottom:10px",
        "line-height:1.2"
      ]);
    }
    if (level === 2) {
      // H2: 左侧一个分离的蓝色小方块，极具杂志感
      return css([
        "font-size:18px",
        "font-weight:700",
        "color:#111827",
        "border-left:6px solid #1e40af", // 实体蓝线，稍微调深
        "padding-left:12px", // 文字与线的距离
        "display:block",
        "line-height:1" // 紧凑行高，配合左侧色块
      ]);
    }
    if (level === 3) {
      return css([
        "font-size:17px",
        "font-weight:700",
        "color:#1e40af", // H3 直接用深蓝色文字
        "margin-bottom:4px",
        "display:inline-block"
      ]);
    }
    return css(["font-size:16px", "font-weight:700"]);
  },

  // 强调：使用稍深一些的蓝色，更易于阅读
  strong: css([
    "font-weight:600",
    "color:#1e40af", // 调深蓝色
    "background-color:#eff6ff", // 保持浅色背景
    "padding:0 4px",
    "border-radius:2px"
  ]),

  // 斜体：优雅的衬线体蓝色
  em: css(["font-style:italic", "color:#2563eb", "font-family:Georgia, serif"]),

  // 链接：极简蓝线，去下划线，改用 border-bottom
  link: css([
    "color:#1e40af",
    "text-decoration:none",
    "border-bottom:1px solid #93c5fd", // 保持浅蓝线
    "padding-bottom:1px",
    "transition:all 0.2s"
  ]),

  ul: css(["margin:0 0 28px 0", "padding-left:16px"]),
  ol: css(["margin:0 0 28px 0", "padding-left:16px"]),
  li: css(["margin:8px 0", "line-height:1.8", "color:#374151"]),

  listParagraph: makeListParagraphStyle({ 
    fontSizePx: 16, 
    lineHeight: 1.8, 
    color: "#374151",
    baseIndentPx: 16
  }),
  
  // 列表符号：深蓝色数字/圆点，字体加粗
  listBullet: css(["color:#1e40af", "font-weight:800", "font-family:Arial"]),

  // 引用：左侧极细蓝线，背景透明，文字变灰，强调留白
  blockquote: css([
    "margin:0 0 28px 0",
    "padding:10px 20px",
    "border-left:2px solid #2563EB", // 极简细线
    "color:#64748b", // Slate 500
    "font-size:15px",
    "background-color:transparent", // 抛弃背景色，更通透
    "font-style:italic"
  ]),

  // 行内代码：浅蓝灰背景，深蓝文字
  inlineCode: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:14px",
    "background-color:#f1f5f9", // Slate 100
    "color:#0f172a", // Slate 900
    "padding:2px 6px",
    "border-radius:4px"
  ]),

  // 代码块：浅色模式（GitHub Light 风格），显得干净、专业
  codeBlockWrapper: css([
    "margin:28px 0",
    "padding:18px",
    "background-color:#f8fafc", // Slate 50
    "border:1px solid #e2e8f0", // 极细灰边框
    "border-radius:6px"
  ]),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`, 
    "font-size:13px", 
    "color:#334155"
  ]),

  // 图片：无边框，极简，略微圆角
  image: css([
    "display:block",
    "margin:32px auto",
    "max-width:100%",
    "height:auto",
    "border-radius:4px"
  ]),

  // 表格样式 - 现代钴蓝主题
  ...makeTableStyles({
    borderColor: "#e2e8f0",
    headerBg: "#f8fafc",
    headerColor: "#1e40af",
    cellColor: "#1e293b"
  }),

  // 代码高亮 - 浅色背景使用浅色方案
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};

export const WECHAT_DEEP_SPACE: WeChatTheme = {
  // 根节点：使用深空灰文字，15px，字间距略微拉大
  root: [
    `font-family:${WECHAT_BODY_FONT_FAMILY}`,
    "font-size:15px",
    "line-height:1.75",
    "color:#0f172a", // Slate 900
    "text-align:left",
    "letter-spacing:0.05em"
  ].join(";"),

  paragraph: css(["margin:0 0 20px 0", "color:#334155", "font-size:15px", "text-align:justify"]),

  headingBlock: (level) => {
    if (level === 1) {
      // H1: 居中，底部双线装饰，像飞船的跑道
      return css(["margin:40px 0 32px 0", "text-align:center"]);
    }
    if (level === 2) {
      // H2: 摒弃左侧色块。使用底部长虚线，模拟行星轨道。
      return css([
        "margin:36px 0 20px 0",
        "padding-bottom:8px",
        "border-bottom:2px dashed #cbd5e1", // 轨道虚线
        "display:block"
      ]);
    }
    // H3: 简单的文字高亮
    return css(["margin:28px 0 16px 0"]);
  },

  headingText: (level) => {
    if (level === 1) {
      // H1: 深紫色，极粗，带字间距
      return css([
        "font-size:28px",
        "font-weight:900",
        "color:#3b0764", // Deep Purple
        "text-transform:uppercase", // 大写（如果是英文），增加严肃感
        "letter-spacing:2px"
      ]);
    }
    if (level === 2) {
      // H2: 【核心设计】星云渐变文字
      return css([
        "font-size:20px",
        "font-weight:800",
        // 渐变色：从紫色到青色
        "background-image:linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)",
        "-webkit-background-clip:text",
        "color:transparent", // 文字透明，显示背景渐变
        "display:inline-block",
        "letter-spacing:0.5px"
      ]);
    }
    if (level === 3) {
      // H3: 像是仪表盘上的指示灯，深蓝
      return css([
        "font-size:17px",
        "font-weight:700",
        "color:#475569",
        "padding-left:12px",
        "border-left:2px solid #7c3aed" // 极细的左侧线作为层级指示，不是色块
      ]);
    }
    return css(["font-size:16px", "font-weight:700"]);
  },

  // 强调：模拟恒星爆发，黑色背景 + 亮青色文字 (High Contrast)
  strong: css([
    "font-weight:700",
    "color:#06b6d4", // Cyan
    "background-color:#0f172a", // Dark Background
    "padding:2px 6px",
    "border-radius:4px"
  ]),

  // 斜体：紫色
  em: css(["font-style:italic", "color:#7c3aed", "font-weight:600"]),

  // 链接：电光紫，带发光效果
  link: css([
    "color:#7c3aed",
    "text-decoration:none",
    "border-bottom:1px solid #d8b4fe",
    "transition:all 0.3s"
  ]),

  ul: css(["margin:0 0 28px 0", "padding-left:20px"]),
  ol: css(["margin:0 0 28px 0", "padding-left:20px"]),
  li: css(["margin:10px 0", "line-height:1.8", "color:#334155"]),

  listParagraph: makeListParagraphStyle({ 
    fontSizePx: 16, 
    lineHeight: 1.9, 
    color: "#334155",
    baseIndentPx: 20
  }),
  
  // 列表符号：使用具体的星形符号 (★) 或实心圆，紫色
  listBullet: css(["color:#7c3aed", "font-size:1.2em", "line-height:1"]),

  // 引用：【核心设计】暗黑物质块 (Dark Matter Block)
  // 这是本主题最明显的特征：纯黑背景引用
  blockquote: css([
    "margin:0 0 28px 0",
    "padding:24px",
    "background-color:#0b0c15", // 接近黑色的深蓝
    "color:#e2e8f0", // 灰白文字
    "border-radius:8px",
    "border:1px solid #1e293b", // 微弱的边框
    "font-size:15px",
    "line-height:1.7",
    "box-shadow:0 10px 30px -10px rgba(0,0,0,0.5)" // 深邃的阴影
  ]),

  // 行内代码：浅紫背景，深紫文字
  inlineCode: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`,
    "font-size:14px",
    "background-color:#f3e8ff", // Purple 100
    "color:#581c87", // Purple 900
    "padding:2px 6px",
    "border-radius:4px",
    "font-weight:600"
  ]),

  // 代码块：浅色背景
  codeBlockWrapper: css([
    "margin:32px 0",
    "padding:20px",
    "background-color:#f8fafc", // Slate 50
    "border-radius:8px",
    "border:1px solid #e2e8f0"
  ]),
  codeBlockP: css(["margin:0", "line-height:1.6"]),
  codeBlockSpan: css([
    `font-family:${WECHAT_CODE_FONT_FAMILY}`, 
    "font-size:13px", 
    "color:#0f172a" // Slate 900
  ]),

  // 图片：无边框，锐利，像卫星照片
  image: css([
    "display:block",
    "margin:32px auto",
    "max-width:100%",
    "height:auto",
    "border-radius:4px",
    "box-shadow:0 0 0 1px rgba(0,0,0,0.05)" // 极细微的边框线
  ]),

  // 表格样式 - 深空探索主题
  ...makeTableStyles({
    borderColor: "#7c3aed",
    headerBg: "#1e1b4b",
    headerColor: "#e9d5ff",
    cellColor: "#0f172a"
  }),

  // 代码高亮 - 深色方案
  // 代码高亮 - 浅色方案
  codeHighlight: CODE_HIGHLIGHT_LIGHT
};
export const WECHAT_THEME_PRESETS: WeChatThemePreset[] = [
  { id: "light-simple", name: "极简黑白（Simple）", theme: WECHAT_LIGHT_SIMPLE_THEME },
  { id: "tech-blue", name: "科技蓝（Theme1）", theme: WECHAT_LIGHT_THEME1 },
  { id: "indigo-card", name: "靛青卡片（Theme2）", theme: WECHAT_LIGHT_THEME2 },
  { id: "swiss-grid", name: "瑞士网格（Swiss Grid）", theme: WECHAT_SWISS_GRID },
  { id: "neo-pop", name: "霓虹波普（Neo Pop）", theme: WECHAT_NEO_POP },
  { id: "marvel-hero", name: "漫威英雄（Marvel Hero）", theme: WECHAT_MARVEL_HERO },
  { id: "persona5", name: "Persona 5", theme: WECHAT_PERSONA5 },
  { id: "purple-highlight", name: "紫色高亮（Default）", theme: WECHAT_LIGHT_THEME },
  { id: "warm-nature", name: "自然森系（Warm Nature）", theme: WECHAT_WARM_NATURE },
  { id: "vitality-orange", name: "活力橙（Vitality）", theme: WECHAT_VITALITY_ORANGE },
  { id: "wechat-pure-glass", name: "原生微光（Pure Glass）", theme: WECHAT_PURE_GLASS },
  { id: "modern-cobalt", name: "现代钴蓝（Cobalt）", theme: WECHAT_MODERN_COBALT },
  { id: "deep-space", name: "深空探索（Space）", theme: WECHAT_DEEP_SPACE },
];

export function getWeChatThemePreset(id: string): WeChatThemePreset {
  return WECHAT_THEME_PRESETS.find((t) => t.id === id) ?? WECHAT_THEME_PRESETS[WECHAT_THEME_PRESETS.length - 1];
}