export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/chat/index',
    'pages/report-loading/index',
    'pages/report-result/index',
    'pages/profile/index',
    'pages/login/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'Inner Book',
    navigationBarTextStyle: 'black',
    navigationStyle: 'custom',
  },
});
