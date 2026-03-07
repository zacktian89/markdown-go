import type { WeChatThemePreset } from '../lib/wechatTheme.js';
import { WECHAT_LIGHT_SIMPLE_THEME } from '../lib/wechatTheme.js';

// Make a small tweak to the simple theme as an example
const MyCustomTheme = {
  ...WECHAT_LIGHT_SIMPLE_THEME,
  root: WECHAT_LIGHT_SIMPLE_THEME.root.replace('color:#2c3e50', 'color:#ff0000'), // Change font color to red
};

export const preset: WeChatThemePreset = {
  id: "custom-red-theme",
  name: "自定义红色主题（演示）",
  theme: MyCustomTheme
};

