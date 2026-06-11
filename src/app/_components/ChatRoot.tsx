'use client'

import { useChat } from '@ai-sdk/react'
import { ChevronDownIcon, ImageUpIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type DragEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import ChatComposer from '@/components/ChatComposer'
import ChatMessage from '@/components/ChatMessage'
import ChatWelcome from '@/components/ChatWelcome'
import ImageLightbox from '@/components/ImageLightbox'
import OnboardingDialog from '@/components/OnboardingDialog'
import ProductGrid from '@/components/ProductGrid'
import ToolStatus from '@/components/ToolStatus'
import TypingIndicator from '@/components/TypingIndicator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { type Profile } from '@/types/profile'
import { type SearchProductsOutput, type UpdateProfileOutput } from '@/types/tool'
import { validateImage } from '@/utils/image'
import { hasProfile, loadProfile, saveProfile } from '@/utils/profile'

const STORAGE_KEY = 'sosie:messages'

// File을 base64 data URL로 변환
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 채팅 페이지 루트
const ChatRoot = () => {
  const { messages, sendMessage, setMessages, status } = useChat()
  const [input, setInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)
  const dragCounter = useRef(0)
  const appliedProfileUpdates = useRef<Set<string>>(new Set())

  const isLoading = status === 'streaming' || status === 'submitted'
  const lastMessage = messages[messages.length - 1]
  const showTyping = isLoading && lastMessage?.role === 'user'

  // 이미지 검증 후 설정
  const acceptImage = (file: File) => {
    const error = validateImage(file)
    if (error) {
      toast.error(error)
      return
    }
    setImageFile(file)
  }

  // 입력 전송
  const handleSubmit = async () => {
    if ((!input.trim() && !imageFile) || isLoading) return

    isAtBottomRef.current = true

    // 프로필 매 요청 body에 첨부
    const options = profile ? { body: { profile } } : undefined

    if (imageFile) {
      const dataUrl = await fileToDataUrl(imageFile)
      sendMessage(
        {
          text: input,
          files: [
            {
              type: 'file',
              mediaType: imageFile.type,
              filename: imageFile.name,
              url: dataUrl,
            },
          ],
        },
        options,
      )
    } else {
      sendMessage({ text: input }, options)
    }

    setInput('')
    setImageFile(null)
  }

  // 웰컴 화면 예시 칩 클릭 시 즉시 전송
  const handleExampleClick = (text: string) => {
    if (isLoading) return
    isAtBottomRef.current = true
    const options = profile ? { body: { profile } } : undefined
    sendMessage({ text }, options)
  }

  // 최신 메시지로 스크롤
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' })
  }

  // 스크롤 위치로 맨 아래 근접 여부 판단, 버튼 노출 토글
  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    const atBottom = distance < 80
    isAtBottomRef.current = atBottom
    setShowScrollDown(!atBottom)
  }

  // 드래그 진입, Files 타입 확인하고 counter 증가
  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    if (!Array.from(e.dataTransfer.types).includes('Files')) return
    dragCounter.current += 1
    setIsDragging(true)
  }

  // 드래그 떠남, counter 감소 후 0이면 오버레이 닫기
  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }

  // 드래그 오버, drop 허용을 위해 preventDefault
  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
  }

  // 드롭, 첫 파일 가져와서 검증
  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) acceptImage(file)
  }

  // 맨 아래 근처일 때만 메시지 변경 시 자동 스크롤
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' })
    }
  }, [messages])

  // 마운트 시 localStorage에서 대화 히스토리, 프로필 복원
  // 첫 진입이면 온보딩
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as typeof messages
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setProfile(loadProfile())
    if (!hasProfile()) setShowOnboarding(true)
    setIsHydrated(true)
  }, [setMessages])

  // 헤더의 프로필 수정 버튼에서 발생하는 이벤트 수신
  useEffect(() => {
    const handler = () => setShowOnboarding(true)
    window.addEventListener('sosie:open-profile', handler)
    return () => window.removeEventListener('sosie:open-profile', handler)
  }, [])

  // 온보딩 완료 시 프로필 저장
  const handleOnboardingSave = (next: Profile) => {
    saveProfile(next)
    setProfile(next)
    setShowOnboarding(false)
  }

  // 온보딩 닫기
  const handleOnboardingClose = () => {
    if (!hasProfile()) saveProfile({})
    setShowOnboarding(false)
  }

  // ClearChatButton 이벤트 수신
  useEffect(() => {
    const handler = () => {
      setMessages([])
      setInput('')
      setImageFile(null)
    }
    window.addEventListener('sosie:clear-chat', handler)
    return () => window.removeEventListener('sosie:clear-chat', handler)
  }, [setMessages])

  // updateProfile Tool 결과 감지
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue
      for (const part of msg.parts) {
        if (
          part.type !== 'tool-updateProfile' ||
          !('state' in part) ||
          part.state !== 'output-available' ||
          !part.output
        ) {
          continue
        }
        const key = 'toolCallId' in part ? (part.toolCallId as string) : ''
        if (!key || appliedProfileUpdates.current.has(key)) continue

        const { updated, mode } = part.output as UpdateProfileOutput
        setProfile((prev) => {
          const base: Profile = prev ?? {}
          const next: Profile = { ...base }
          if (mode === 'replace') {
            if (updated.styles !== undefined) next.styles = updated.styles
            if (updated.brands !== undefined) next.brands = updated.brands
            if (updated.size !== undefined) next.size = updated.size
            if (updated.budget !== undefined) next.budget = updated.budget
          } else {
            if (updated.styles)
              next.styles = Array.from(new Set([...(base.styles ?? []), ...updated.styles]))
            if (updated.brands)
              next.brands = Array.from(new Set([...(base.brands ?? []), ...updated.brands]))
            if (updated.size !== undefined) next.size = updated.size
            if (updated.budget) next.budget = updated.budget
          }
          saveProfile(next)
          return next
        })
        appliedProfileUpdates.current.add(key)
      }
    }
  }, [messages])

  // 메시지 변경 시 localStorage에 자동 저장
  useEffect(() => {
    if (messages.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // 저장 용량 초과 등은 무시
    }
  }, [messages])

  return (
    <main
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex min-h-0 flex-1 flex-col"
    >
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col overflow-auto"
      >
        {!isHydrated ? (
          <div className="animate-in fade-in mx-auto w-full max-w-3xl space-y-4 px-4 pt-6 pb-10 duration-300">
            <div className="flex justify-end">
              <Skeleton className="h-10 w-40 rounded-2xl rounded-br-sm" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-24 w-3/5 rounded-2xl rounded-bl-sm" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-32 rounded-2xl rounded-br-sm" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="animate-in fade-in flex flex-1 flex-col duration-300">
            <ChatWelcome onExampleClick={handleExampleClick} />
          </div>
        ) : (
          <div className="animate-in fade-in mx-auto w-full max-w-3xl space-y-3 px-4 pt-6 pb-10 duration-300">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-2"
              >
                {msg.parts.map((part, idx) => {
                  if (part.type === 'text') {
                    return (
                      <ChatMessage
                        key={idx}
                        role={msg.role === 'assistant' ? 'assistant' : 'user'}
                        content={part.text}
                      />
                    )
                  }

                  if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'flex w-full',
                          msg.role === 'user' ? 'justify-end' : 'justify-start',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setLightboxUrl(part.url)}
                          aria-label="이미지 확대"
                          className="block h-48 w-48 overflow-hidden rounded-2xl border transition-opacity hover:opacity-90"
                        >
                          <img
                            src={part.url}
                            alt="첨부 이미지"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      </div>
                    )
                  }

                  if (
                    part.type === 'tool-searchProducts' &&
                    'state' in part &&
                    part.state === 'output-available' &&
                    part.output
                  ) {
                    const output = part.output as SearchProductsOutput
                    return (
                      <div key={idx} className="space-y-3">
                        <ToolStatus toolType={part.type} state={part.state} />
                        {output.products.length > 0 && <ProductGrid products={output.products} />}
                      </div>
                    )
                  }

                  if (part.type.startsWith('tool-') && 'state' in part && part.state) {
                    return <ToolStatus key={idx} toolType={part.type} state={part.state} />
                  }
                  return null
                })}
              </motion.div>
            ))}
            <AnimatePresence>
              {showTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <TypingIndicator />
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            aria-label="맨 아래로"
            className="bg-background/90 hover:bg-accent absolute bottom-24 left-1/2 z-30 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border shadow-md backdrop-blur"
          >
            <ChevronDownIcon className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <ChatComposer
        value={input}
        onChange={setInput}
        imageFile={imageFile}
        onImageChange={setImageFile}
        onSubmit={handleSubmit}
        disabled={isLoading}
      />

      {isDragging && (
        <div className="bg-background/80 pointer-events-none absolute inset-0 z-40 flex items-center justify-center backdrop-blur-sm">
          <div className="border-primary text-primary flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-12 py-10">
            <ImageUpIcon className="h-12 w-12" />
            <p className="text-sm font-medium">이미지를 여기에 놓으세요</p>
          </div>
        </div>
      )}

      <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />

      <OnboardingDialog
        open={showOnboarding}
        initialProfile={profile}
        onSave={handleOnboardingSave}
        onClose={handleOnboardingClose}
      />
    </main>
  )
}

export default ChatRoot
