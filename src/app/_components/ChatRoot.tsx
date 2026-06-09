'use client'

import { useChat } from '@ai-sdk/react'
import { useEffect, useRef, useState } from 'react'

import ChatComposer from '@/components/ChatComposer'
import ChatMessage from '@/components/ChatMessage'
import ChatWelcome from '@/components/ChatWelcome'

// 채팅 페이지 루트
const ChatRoot = () => {
  const { messages, sendMessage, status } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isLoading = status === 'streaming' || status === 'submitted'

  // 입력 전송
  const handleSubmit = () => {
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  // 메시지 변경 시 하단으로 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' })
  }, [messages])

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {messages.length === 0 ? (
          <ChatWelcome />
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-4 px-4 pt-6 pb-10">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role === 'assistant' ? 'assistant' : 'user'}
                content={msg.parts
                  .filter((p) => p.type === 'text')
                  .map((p) => p.text)
                  .join('')}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        disabled={isLoading}
      />
    </main>
  )
}

export default ChatRoot
