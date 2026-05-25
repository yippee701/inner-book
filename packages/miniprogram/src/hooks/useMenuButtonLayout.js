import { useMemo } from 'react';
import Taro from '@tarojs/taro';

const DEFAULT_MENU_BUTTON_VARS = {
  '--mp-menu-top': '88px',
  '--mp-header-side-gap': '28px',
};

export function useMenuButtonLayout() {
  return useMemo(() => {
    try {
      const menuButton = Taro.getMenuButtonBoundingClientRect?.();
      const systemInfo = Taro.getSystemInfoSync?.();
      if (!menuButton?.top || !menuButton?.right) return DEFAULT_MENU_BUTTON_VARS;

      const windowWidth = systemInfo?.windowWidth || systemInfo?.screenWidth || menuButton.right;
      const rightGap = Math.max(0, windowWidth - menuButton.right);

      return {
        '--mp-menu-top': `${menuButton.top}px`,
        '--mp-header-side-gap': `${rightGap}px`,
      };
    } catch {
      return DEFAULT_MENU_BUTTON_VARS;
    }
  }, []);
}
