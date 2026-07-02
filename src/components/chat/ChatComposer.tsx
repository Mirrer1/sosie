'use client'

import { ImageIcon, SendIcon, XIcon } from 'lucide-react'
import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

import ImageLightbox from '@/components/chat/ImageLightbox'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/providers/LanguageProvider'
import { ALLOWED_IMAGE_TYPES, validateImage } from '@/utils/image'

type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  imageFile: File | null
  onImageChange: (file: File | null) => void
  onSubmit: () => void
  disabled?: boolean
}

// 채팅 입력창
const ChatComposer = ({
  value,
  onChange,
  imageFile,
  onImageChange,
  onSubmit,
  disabled = false,
}: ChatComposerProps) => {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  // imageFile 변경 시 다시 만드는 첨부 이미지 미리보기 URL
  const previewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile])

  // 이미지 검증 후 부모에게 전달
  const acceptImage = (file: File) => {
    const error = validateImage(file)
    if (error) {
      toast.error(t(error === 'type' ? 'image.errorType' : 'image.errorSize'))
      return
    }
    onImageChange(file)
  }

  // 파일 선택 input 변경
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) acceptImage(file)
    e.target.value = ''
  }

  // 클립보드 붙여넣기에서 이미지 추출
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          acceptImage(file)
          return
        }
      }
    }
  }

  // Enter로 전송하고 Shift+Enter나 Ctrl+Enter로 줄바꿈
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  // 미리보기 URL 메모리 정리
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  return (
    <div className="bg-background border-t">
      <div className="mx-auto max-w-3xl px-4 py-3">
        <div className="bg-card flex flex-col gap-2 rounded-2xl border p-2">
          {previewUrl && (
            <div className="relative w-fit">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                aria-label={t('chat.imageZoom')}
                className="block h-20 w-20 overflow-hidden rounded-md border transition-opacity hover:opacity-80"
              >
                <img
                  src={previewUrl}
                  alt={t('chat.previewImage')}
                  className="h-full w-full object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() => onImageChange(null)}
                aria-label={t('chat.removeImage')}
                className="bg-background absolute -top-2 -right-2 rounded-full border p-0.5"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="shrink-0"
              aria-label={t('chat.uploadImage')}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || !!imageFile}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              hidden
              onChange={handleFileSelect}
            />
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={t('chat.placeholder')}
              className="min-h-0 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              rows={1}
              disabled={disabled}
            />
            <Button
              size="icon"
              className="shrink-0"
              aria-label={t('chat.send')}
              onClick={onSubmit}
              disabled={disabled || (!value.trim() && !imageFile)}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <ImageLightbox
        src={isLightboxOpen ? previewUrl : null}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  )
}

export default ChatComposer
