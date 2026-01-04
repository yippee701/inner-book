import { Link } from 'react-router-dom';

export default function Page1() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="w-full bg-gradient-to-br from-blue-400 to-blue-600 aspect-video flex items-center justify-center">
            <span className="text-white text-4xl font-bold">设计稿 1</span>
          </div>
          <div className="p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">第一页</h1>
            <p className="text-gray-600 mb-6">欢迎来到Know Yourself应用</p>
            <div className="flex gap-4">
              <Link 
                to="/page2"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                下一页
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
