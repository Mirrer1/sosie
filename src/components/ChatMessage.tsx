import { cn } from '@/lib/utils'

type ChatMessageProps = {
  role: 'user' | 'assistant'
  content: string
}

const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-card text-card-foreground rounded-bl-sm border',
        )}
      >
        {content}
      </div>
    </div>
  )
}

export default ChatMessage
