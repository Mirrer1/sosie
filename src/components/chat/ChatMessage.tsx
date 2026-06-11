import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

type ChatMessageProps = {
  role: 'user' | 'assistant'
  content: string
}

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => <p className="leading-relaxed [&:not(:first-child)]:mt-3">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => <code className="bg-muted rounded px-1 py-0.5 text-xs">{children}</code>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
      {children}
    </a>
  ),
  h1: ({ children }) => <h3 className="mt-3 mb-2 text-base font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-3 mb-2 text-base font-semibold">{children}</h3>,
  h3: ({ children }) => <h3 className="mt-3 mb-2 text-sm font-semibold">{children}</h3>,
}

// 채팅 말풍선
// assistant는 마크다운 렌더링
const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm whitespace-pre-wrap'
            : 'bg-card text-card-foreground rounded-bl-sm border',
        )}
      >
        {isUser ? (
          content
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}

export default ChatMessage
