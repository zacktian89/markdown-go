/**
 * Mermaid 图表渲染工具
 * 
 * 提供 Mermaid 语法解析、渲染和导出功能
 */
import mermaid from 'mermaid';
import { createLogger } from './logger.js';

const logger = createLogger('Mermaid');

// Mermaid 实例 ID 计数器
let mermaidIdCounter = 0;

/**
 * 初始化 Mermaid 配置
 * @param isDarkTheme - 是否使用深色主题
 * @param forExport - 是否用于导出（导出时禁用 htmlLabels 以避免 foreignObject 问题）
 */
export function initMermaid(isDarkTheme: boolean = false, forExport: boolean = false): void {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDarkTheme ? 'dark' : 'default',
    // 安全配置
    securityLevel: 'strict',
    // 通用配置
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    // 流程图配置
    flowchart: {
      useMaxWidth: true,
      // 导出时禁用 htmlLabels，使用纯 SVG 文本
      // 这样可以避免 foreignObject 导致的 Canvas tainted 问题
      htmlLabels: !forExport,
      curve: 'basis',
    },
    // 序列图配置
    sequence: {
      useMaxWidth: true,
      diagramMarginX: 50,
      diagramMarginY: 10,
    },
    // Gantt 图配置
    gantt: {
      useMaxWidth: true,
    },
    // 类图配置
    class: {
      // 类图也禁用 htmlLabels 以支持导出
      htmlLabels: !forExport,
    },
  });
  logger.info(`Mermaid initialized with ${isDarkTheme ? 'dark' : 'light'} theme${forExport ? ' (export mode)' : ''}`);
}

/**
 * 生成唯一的 Mermaid 图表 ID
 */
export function generateMermaidId(): string {
  return `mermaid-diagram-${++mermaidIdCounter}`;
}

/**
 * 渲染 Mermaid 图表
 * @param code - Mermaid 语法代码
 * @param id - 图表元素 ID
 * @returns 渲染后的 SVG HTML 字符串
 */
export async function renderMermaid(code: string, id?: string): Promise<string> {
  const diagramId = id || generateMermaidId();
  
  try {
    // 验证语法
    const parseResult = await mermaid.parse(code);
    if (!parseResult) {
      throw new Error('Invalid Mermaid syntax');
    }
    
    // 渲染图表
    const { svg } = await mermaid.render(diagramId, code);
    logger.info(`Successfully rendered Mermaid diagram: ${diagramId}`);

    return svg;
  } catch (error) {
    logger.error(`Failed to render Mermaid diagram: ${diagramId}`, error);
    throw error;
  }
}

/**
 * 解析 Mermaid 语法，检查是否有效
 * @param code - Mermaid 语法代码
 * @returns 是否有效
 */
export async function validateMermaid(code: string): Promise<boolean> {
  try {
    await mermaid.parse(code);
    return true;
  } catch {
    return false;
  }
}

/**
 * 将 SVG 转换为 PNG Data URL
 * @param svgElement - SVG 元素
 * @param scale - 缩放比例，默认为 2（2x 分辨率）
 * @returns PNG Data URL
 */
export async function svgToPngDataUrl(svgElement: SVGElement, scale: number = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = svgElement.getBoundingClientRect().width || 800;
        const height = svgElement.getBoundingClientRect().height || 600;
        
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // 白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        URL.revokeObjectURL(url);
        
        try {
          const pngDataUrl = canvas.toDataURL('image/png');
          resolve(pngDataUrl);
        } catch (e) {
          reject(e);
        }
      };
      
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      
      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 将 SVG 字符串转换为 PNG Data URL
 * 这个函数专门用于微信复制场景，不需要 SVG 元素已在 DOM 中
 * 
 * 注意：Mermaid 的流程图和类图使用 foreignObject 元素来渲染 HTML，
 * 需要特殊处理才能正确转换为 PNG
 * 
 * @param svgString - SVG HTML 字符串
 * @param scale - 缩放比例，默认为 2（2x 分辨率，确保清晰度）
 * @returns PNG Data URL
 */
export async function svgStringToPngDataUrl(svgString: string, scale: number = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // 创建临时容器来获取 SVG 尺寸
      const container = document.createElement('div');
      container.style.cssText = 'position: absolute; left: -9999px; top: -9999px; visibility: hidden;';
      container.innerHTML = svgString;
      document.body.appendChild(container);
      
      const svgElement = container.querySelector('svg');
      if (!svgElement) {
        document.body.removeChild(container);
        reject(new Error('No SVG element found in the provided string'));
        return;
      }
      
      // 获取 SVG 的真实尺寸
      const rect = svgElement.getBoundingClientRect();
      let width = rect.width || 800;
      let height = rect.height || 600;
      
      // 尝试从 viewBox 或属性获取尺寸
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/\s+/);
        if (parts.length >= 4) {
          width = parseFloat(parts[2]) || width;
          height = parseFloat(parts[3]) || height;
        }
      }
      
      // 也尝试从 width/height 属性获取
      const attrWidth = svgElement.getAttribute('width');
      const attrHeight = svgElement.getAttribute('height');
      if (attrWidth && !attrWidth.includes('%')) {
        width = parseFloat(attrWidth) || width;
      }
      if (attrHeight && !attrHeight.includes('%')) {
        height = parseFloat(attrHeight) || height;
      }
      
      // 确保 SVG 有明确的尺寸
      svgElement.setAttribute('width', String(width));
      svgElement.setAttribute('height', String(height));
      
      // 设置 xmlns 属性（某些情况下可能缺失）
      if (!svgElement.getAttribute('xmlns')) {
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      
      // 添加白色背景 rect 作为第一个子元素
      const existingBg = svgElement.querySelector('rect[data-bg]');
      if (!existingBg) {
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('width', '100%');
        bgRect.setAttribute('height', '100%');
        bgRect.setAttribute('fill', '#ffffff');
        bgRect.setAttribute('data-bg', 'true');
        svgElement.insertBefore(bgRect, svgElement.firstChild);
      }
      
      // 处理 foreignObject 中的内容
      // 为所有 foreignObject 内的元素添加命名空间
      const foreignObjects = svgElement.querySelectorAll('foreignObject');
      foreignObjects.forEach((fo) => {
        // 确保 foreignObject 内的 HTML 元素有正确的命名空间
        const divs = fo.querySelectorAll('div, span, p');
        divs.forEach((el) => {
          if (!el.getAttribute('xmlns')) {
            el.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
          }
        });
      });
      
      // 序列化修改后的 SVG
      const modifiedSvgString = new XMLSerializer().serializeToString(svgElement);
      
      // 移除临时容器
      document.body.removeChild(container);
      
      // 使用 Base64 Data URL 而不是 Blob URL
      // 这可以避免一些跨域和安全策略问题
      const base64Svg = btoa(unescape(encodeURIComponent(modifiedSvgString)));
      const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;
      
      const img = new Image();
      // 设置 crossOrigin 以允许从 data URL 读取
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // 白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);
        
        try {
          const pngDataUrl = canvas.toDataURL('image/png');
          logger.info(`SVG converted to PNG: ${width}x${height} @ ${scale}x`);
          resolve(pngDataUrl);
        } catch (e) {
          logger.error('Canvas toDataURL failed (tainted canvas?)', e);
          reject(e);
        }
      };
      
      img.onerror = (e) => {
        logger.error('Failed to load SVG as image for PNG conversion', e);
        reject(new Error('Failed to load SVG as image'));
      };
      
      img.src = dataUrl;
    } catch (error) {
      logger.error('svgStringToPngDataUrl error:', error);
      reject(error);
    }
  });
}

/**
 * 复制 SVG 到剪贴板
 * @param svgElement - SVG 元素
 */
export async function copySvgToClipboard(svgElement: SVGElement): Promise<void> {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/svg+xml': blob,
        // 同时提供文本格式作为后备
        'text/plain': new Blob([svgData], { type: 'text/plain' }),
      }),
    ]);
    logger.info('SVG copied to clipboard');
  } catch (error) {
    // 如果 ClipboardItem 不支持 SVG，尝试只复制文本
    try {
      await navigator.clipboard.writeText(svgData);
      logger.info('SVG copied to clipboard as text');
    } catch (e) {
      logger.error('Failed to copy SVG to clipboard', e);
      throw e;
    }
  }
}

/**
 * 复制 PNG 到剪贴板
 * @param svgElement - SVG 元素
 */
export async function copyPngToClipboard(svgElement: SVGElement): Promise<void> {
  try {
    const pngDataUrl = await svgToPngDataUrl(svgElement);
    const response = await fetch(pngDataUrl);
    const blob = await response.blob();
    
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ]);
    logger.info('PNG copied to clipboard');
  } catch (error) {
    logger.error('Failed to copy PNG to clipboard', error);
    throw error;
  }
}

/**
 * 下载 SVG 文件
 * @param svgElement - SVG 元素
 * @param filename - 文件名
 */
export function downloadSvg(svgElement: SVGElement, filename: string = 'mermaid-diagram.svg'): void {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  logger.info(`SVG downloaded as ${filename}`);
}

/**
 * 下载 PNG 文件
 * @param svgElement - SVG 元素
 * @param filename - 文件名
 */
export async function downloadPng(svgElement: SVGElement, filename: string = 'mermaid-diagram.png'): Promise<void> {
  try {
    const pngDataUrl = await svgToPngDataUrl(svgElement);
    
    const link = document.createElement('a');
    link.href = pngDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logger.info(`PNG downloaded as ${filename}`);
  } catch (error) {
    logger.error('Failed to download PNG', error);
    throw error;
  }
}

/**
 * 检测代码块是否为 Mermaid 语法
 * @param language - 代码块语言标识
 */
export function isMermaidLanguage(language: string): boolean {
  const normalizedLang = language.toLowerCase().trim();
  return normalizedLang === 'mermaid' || normalizedLang === 'mmd';
}

