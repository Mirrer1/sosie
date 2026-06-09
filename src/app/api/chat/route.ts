import { google } from '@ai-sdk/google'
import { type UIMessage, convertToModelMessages, streamText } from 'ai'

export const maxDuration = 30

// Gemini Streaming 채팅 메세지 응답
export const POST = async (req: Request) => {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: google('gemini-2.5-flash-lite'),
    system: '당신은 Sosie라는 패션 쇼핑 AI 도우미입니다. 친근하고 간결하게 한국어로 답변하세요.',
    messages: modelMessages,
  })

  return result.toUIMessageStreamResponse()
}
