import { Link } from 'react-router-dom';

export default function Page3() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="w-full bg-gradient-to-br from-green-400 to-green-600 aspect-video flex items-center justify-center">
            <span className="text-white text-4xl font-bold">设计稿 3</span>
          </div>
          <div className="p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">第三页</h1>
            <p className="text-gray-600 mb-6">发现更好的自己</p>
            <div className="flex gap-4">
              <Link 
                to="/page1"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                回到开始
              </Link>
              <Link 
                to="/page2"
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                上一页
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
