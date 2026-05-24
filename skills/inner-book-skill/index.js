/**
 * 云函数入口：从模块对象上调用 generateCoverImage，避免 "is not a function"
 */
const { generateCoverImage } = require('./cover-image-generator.js');

exports.main_handler = async (event, context) => {
  const params = typeof event === 'string' ? JSON.parse(event) : event || {};
  const { title, bgId = 1, backgroundBase64 } = params;

  const dataURL = await generateCoverImage({ title, bgId, backgroundBase64, output: 'dataURL' });
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataURL }),
  };
};
