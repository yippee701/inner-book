export default defineAppConfig({
  /** 按需注入：仅注入当前页依赖，降低启动耗时与内存（基础库 ≥2.11.1） */
  lazyCodeLoading: 'requiredComponents',
  pages: [
    'pages/index/index',
    'pages/chat/index',
    'pages/report-loading/index',
    'pages/report-result/index',
    'pages/profile/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'Inner Book',
    navigationBarTextStyle: 'black',
    navigationStyle: 'custom',
  },
  useExtendedLib: {
    weui: true,
  },
  usingComponents: {
    'mp-icon': 'weui-miniprogram/icon/icon',
  }
});
