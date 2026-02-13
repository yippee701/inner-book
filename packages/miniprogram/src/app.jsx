import { PropsWithChildren } from 'react';
import { useLaunch } from '@tarojs/taro';
import { initMpAdapters } from './adapters/index';
import { ReportProvider } from './contexts/ReportContext';
import { CloudbaseProvider } from './contexts/cloudbaseContext';
import './app.scss';

// 在最早的时机初始化适配器
initMpAdapters();

function App({ children }) {
  useLaunch(() => {
    console.log('App launched.');
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
