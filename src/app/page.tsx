import ChatComposer from '@/components/ChatComposer'
import ChatMessage from '@/components/ChatMessage'
import Header from '@/components/Header'

const MOCK_MESSAGES = [
  {
    id: '1',
    role: 'user' as const,
    content: '발마칸 코트 추천해줘',
  },
  {
    id: '2',
    role: 'assistant' as const,
    content:
      '요즘 발마칸은 오버핏이 핫해요. 유니폼브릿지가 디자인 단순하면서 가성비 좋습니다. 무신사에서 12만원으로 가장 저렴해요.\n\n다른 브랜드도 비교해드릴까요?',
  },
]

const Home = () => {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
            {MOCK_MESSAGES.map((msg) => (
              <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
            ))}
          </div>
        </div>
        <ChatComposer />
      </main>
    </>
  )
}

export default Home
