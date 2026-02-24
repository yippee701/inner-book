export default defineAppConfig({
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
