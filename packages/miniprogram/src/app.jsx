import { PropsWithChildren } from 'react';
import Taro, { useLaunch } from '@tarojs/taro';
import { initMpAdapters } from './adapters/index';
import { ReportProvider } from './contexts/ReportContext';
import { CloudbaseProvider } from './contexts/cloudbaseContext';
import './app.scss';

function getMiniProgramVersion() {
  try {
    const accountInfo = Taro.getAccountInfoSync?.();
    const miniProgram = accountInfo?.miniProgram || {};
    return miniProgram.version || miniProgram.envVersion || 'unknown';
  } catch {
    return 'unknown';
  }
}

function getMiniProgramEnvVersion() {
  try {
    const accountInfo = Taro.getAccountInfoSync?.();
    return accountInfo?.miniProgram?.envVersion || 'unknown';
  } catch {
    return 'unknown';
  }
}

// 在最早的时机初始化适配器
initMpAdapters();

function App({ children }) {
  useLaunch(() => {
    console.log('[MiniProgram] version:', getMiniProgramVersion(), 'envVersion:', getMiniProgramEnvVersion());
  });

  return (
    <CloudbaseProvider>
      <ReportProvider>
        {children}
      </ReportProvider>
    </CloudbaseProvider>
  );
}

export default App;
