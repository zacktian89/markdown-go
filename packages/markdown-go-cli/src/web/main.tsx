import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Palette, Copy, X, Check, Loader2, CheckCircle2 } from 'lucide-react';
import { renderMarkdownToWeChatHtmlAsync } from '../lib/wechat.js';
import { WECHAT_THEME_PRESETS } from '../lib/wechatTheme.js';
import { processImagesToBase64 } from './imageUtils.js';

import './index.css';

// Reusable utility for conditional class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const WeChatIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8.225 3c-4.321 0-7.825 3.016-7.825 6.736 0 2.219 1.251 4.18 3.197 5.432l-.815 2.454 2.378-1.189c.35.097.712.146 1.077.146.402 0 .79-.059 1.164-.162-.352-.774-.551-1.637-.551-2.551 0-3.61 3.257-6.536 7.275-6.536.438 0 .864.037 1.277.106-.708-2.618-3.535-4.436-7.177-4.436zm-.486 3.109c.477 0 .864.387.864.864 0 .477-.387.864-.864.864-.477 0-.864-.387-.864-.864 0-.477.387-.864.864-.864zm4.181 0c.477 0 .864.387.864.864 0 .477-.387.864-.864.864s-.864-.387-.864-.864c0-.477.387-.864.864-.864zm3.855 3.111c-3.69 0-6.681 2.502-6.681 5.589 0 1.638.85 3.11 2.193 4.133l-.538 1.619 1.884-.919c.376.108.771.166 1.176.166 3.691 0 6.681-2.502 6.681-5.589 0-3.087-2.99-5.589-6.681-5.589zm-2.071 2.503c.361 0 .653.292.653.653s-.292.653-.653.653-.653-.292-.653-.653.292-.653.653-.653zm3.179 0c.361 0 .653.292.653.653s-.292.653-.653.653-.653-.292-.653-.653.292-.653.653-.653z" />
  </svg>
);

function App() {
  const [markdown, setMarkdown] = useState('');
  const [filePath, setFilePath] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [themeId, setThemeId] = useState(WECHAT_THEME_PRESETS[0].id);
  const [customThemes, setCustomThemes] = useState<any[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const toastTimerRef = React.useRef<any>(null);

  // 1. Fetch initial content and setup SSE for live reload
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const urlPath = window.location.pathname;
        const apiUri = urlPath && urlPath !== '/' 
          ? `/api/init?path=${encodeURIComponent(urlPath)}` 
          : '/api/init';
        
        const res = await fetch(apiUri);
        const data = await res.json();
        setMarkdown(data.content || '');
        setFilePath(data.originalPath || data.fullPath || data.path || '');
        if (data.themes) {
          setCustomThemes(data.themes);
        }
      } catch (e) {
        console.error('Failed to fetch initial content', e);
      }
    };

    fetchContent();

    const sse = new EventSource('/api/events');
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update') {
          const currentPath = window.location.pathname;
          // Normalize paths for comparison (remove leading/trailing slashes, use forward slashes)
          const normalize = (p: string) => p.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
          
          if (normalize(data.path) === normalize(currentPath)) {
            console.log('Received file update for current file:', data.path);
            setMarkdown(data.content);
            setFilePath(data.originalPath || data.fullPath || data.path);
          }
        }
      } catch (e) {
        console.error('SSE Error:', e);
      }
    };

    return () => sse.close();
  }, [window.location.pathname]);

  const allThemes = useMemo(() => [...WECHAT_THEME_PRESETS, ...customThemes], [customThemes]);
  const activeTheme = useMemo(() => allThemes.find(t => t.id === themeId)?.theme || WECHAT_THEME_PRESETS[0].theme, [themeId, allThemes]);
  const activeThemeName = useMemo(() => allThemes.find(t => t.id === themeId)?.name || '默认', [themeId, allThemes]);

  // 2. Render Markdown to WeChat HTML whenever content or theme changes
  useEffect(() => {
    let active = true;
    (async () => {
      if (!markdown) {
        if (active) setHtmlContent('');
        return;
      }
      setIsRendering(true);
      try {
        const rawHtml = await renderMarkdownToWeChatHtmlAsync(markdown, activeTheme);
        const finalHtml = await processImagesToBase64(rawHtml, window.location.pathname);
        if (active) {
          setHtmlContent(finalHtml);
        }
      } catch (e) {
        console.error('Render error:', e);
      } finally {
        if (active) setIsRendering(false);
      }
    })();
    return () => { active = false; };
  }, [markdown, activeTheme]);

  const handleCopy = async () => {
    const container = document.getElementById('preview-content');
    if (!container) return;

    const htmlStr = container.innerHTML;
    const plainStr = container.innerText;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({
          'text/html': new Blob([htmlStr], { type: 'text/html' }),
          'text/plain': new Blob([plainStr], { type: 'text/plain' })
        });
        await navigator.clipboard.write([item]);
        showToast();
      } else {
        const temp = document.createElement('div');
        temp.contentEditable = 'true';
        temp.innerHTML = htmlStr;
        document.body.appendChild(temp);
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(temp);
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand('copy');
        temp.remove();
        showToast();
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('复制失败，可能是浏览器限制。请重试或手动选中全文复制 (Ctrl+A, Ctrl+C)');
    }
  };

  const showToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000);
  };

  const toggleThemePanel = () => setIsThemePanelOpen((open) => !open);
  const closeThemePanel = () => setIsThemePanelOpen(false);

  const renderThemePanel = () => (
    <>
      <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Palette size={16} className="text-accent" />
          排版主题
        </h2>
        <button
          type="button"
          onClick={closeThemePanel}
          className="icon-btn h-8 w-8 hover:bg-fg/10"
          aria-label="关闭排版主题栏"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar min-h-0">
        {allThemes.map((opt) => {
          const isActive = opt.id === themeId;
          return (
            <button
              type="button"
              key={opt.id}
              className={cn(
                "group flex w-full items-center h-10 px-3 rounded-lg cursor-pointer transition-colors text-left whitespace-nowrap",
                isActive
                  ? "bg-accent text-bg"
                  : "hover:bg-accent/5"
              )}
              onClick={(event) => {
                event.stopPropagation();
                setThemeId(opt.id);
              }}
            >
              <Palette
                size={14}
                className={cn("mr-3 shrink-0", isActive ? "text-bg/80" : "text-accent/70")}
              />
              <span className="flex-1 min-w-0 truncate text-sm whitespace-nowrap">{opt.name}</span>
              {isActive && (
                <Check size={14} className="text-bg/80 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

    </>
  );

  return (
    <div className="h-full flex flex-col bg-bg font-sans overflow-hidden">
      {/* Opaque Header */}
      <header className="shrink-0 z-40 bg-card border-b border-border shadow-sm px-4 h-14 flex items-center">
        <div className="max-w-[1200px] w-full mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <h1 className="text-sm font-bold text-fg m-0 flex items-center shrink-0">
              预览
            </h1>
            <div className="w-px h-3 bg-border/50 shrink-0" />
            <span className="text-xs text-muted truncate font-mono bg-fg/5 px-2 py-0.5 rounded border border-border/30" title={filePath}>
              {filePath || '未命名'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleThemePanel}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border min-w-0 max-w-[260px] transition-colors",
                isThemePanelOpen
                  ? "border-accent/15 bg-accent/5 text-fg"
                  : "border-border bg-bg/60 text-muted hover:bg-fg/5 hover:text-fg"
              )}
              aria-label={isThemePanelOpen ? "关闭排版主题栏" : "打开排版主题栏"}
              aria-pressed={isThemePanelOpen}
            >
              <Palette size={16} className="shrink-0 text-accent/80" />
              <span className="truncate whitespace-nowrap text-sm font-medium text-fg">{activeThemeName}</span>
            </button>
            
            <div className="w-px h-4 bg-border/50 mx-1" />

            <button
              type="button"
              onClick={handleCopy}
              disabled={isRendering || !htmlContent}
              className="btn btn-primary h-9 px-4 gap-2 text-sm"
            >
              <WeChatIcon size={16} />
              <span>复制</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Scrollable Preview Area */}
        <main className="flex-1 overflow-y-auto bg-bg/50 custom-scrollbar">
          <div className="max-w-[850px] mx-auto my-3 sm:my-8 bg-white p-4 sm:p-10 rounded-xl shadow-soft min-h-[500px] border border-border/50">
            {htmlContent ? (
              <div id="preview-content" className="md-preview" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted space-y-4">
                {markdown ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                    <span className="text-sm">渲染中</span>
                  </>
                ) : (
                  <span className="text-sm italic">暂无内容，请在编辑器中撰写</span>
                )}
              </div>
            )}
          </div>
          
          <div className="h-20" /> {/* Bottom spacer */}
        </main>

        {isThemePanelOpen && (
          <aside className="flex w-[42vw] min-w-[180px] max-w-[360px] shrink-0 bg-card border border-border/50 shadow-soft rounded-xl my-3 sm:my-8 mr-3 sm:mr-8 flex-col overflow-hidden">
            {renderThemePanel()}
          </aside>
        )}
      </div>

      {/* Toast Notification */}
      <div className={cn(
        "fixed bottom-10 left-1/2 -translate-x-1/2 bg-accent text-bg px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 z-[100]",
        toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <CheckCircle2 size={18} />
        <span className="text-sm font-medium">复制成功，可直接粘贴到微信公众号编辑器。</span>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<App />);
}



