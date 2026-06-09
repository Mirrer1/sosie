'use client'

import { ImageIcon, SendIcon } from 'lucide-react'
import { type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

const ChatComposer = ({ value, onChange, onSubmit, disabled = false }: ChatComposerProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="bg-background border-t">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div className="bg-card flex items-end gap-2 rounded-2xl border p-2">
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="이미지 업로드">
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="찾고 싶은 옷을 자유롭게 알려주세요"
            className="min-h-0 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            rows={1}
            disabled={disabled}
          />
          <Button
            size="icon"
            className="shrink-0"
            aria-label="보내기"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChatComposer
