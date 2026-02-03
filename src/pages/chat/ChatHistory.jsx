import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import MessageList from './MessageList';
import { useDb } from '../../contexts/cloudbaseContext';
import { getMessages as getMessagesApi } from '../../api/report';

function BackgroundGlow() {
  return (
    <>
      <div
        className="absolute top-10 left-1/3 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(196, 181, 253, 0.25)' }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(221, 214, 254, 0.2)' }}
      />
      <div
        className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(233, 213, 255, 0.3)' }}
      />
    </>
  );
}

export default function ChatHistory() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const db = useDb();
  const reportId = searchParams.get('reportId');
  const messageListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reportId || !db) {
      if (!reportId) navigate('/');
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMessagesApi(db, reportId)
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const list = data.map((item, index) => ({
          id: item._id ?? item.id ?? `msg-${index}`,
          role: item.role ?? 'user',
          content: item.content ?? '',
        }));
        setMessages(list);
      })
      .catch((err) => {
        if (!cancelled) console.error('获取历史对话失败:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [db, reportId, navigate]);

  if (!reportId) return null;

  return (
    <div className="h-screen-safe w-full bg-white flex flex-col overflow-hidden max-w-md mx-auto relative">
      <BackgroundGlow />

      <header
        className="flex items-center justify-between px-4 py-1 relative z-10"
        style={{ borderBottom: '1px solid rgba(243, 244, 246, 1)' }}
      >
        <Link
          to="#"
          onClick={(e) => {
            e.preventDefault();
            navigate(-1);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-gray-900 font-medium">完整对话过程</h1>
        <div className="w-10 h-10" />
      </header>

      <div className="flex-1 px-5 relative z-10 overflow-y-auto pb-8">
        <div className="max-w-lg mx-auto pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">加载对话中...</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(139, 168, 255, 0.1))',
                }}
              >
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm text-center">
                暂无对话记录
              </p>
              <p className="text-gray-400 text-xs mt-1 text-center">
                该报告可能尚未同步对话内容
              </p>
            </div>
          ) : (
            <MessageList
              ref={messageListRef}
              messages={messages}
              keyboardHeight={0}
              recommendedAnswers={[]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
