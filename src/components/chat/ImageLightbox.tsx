'use client'

import { XIcon } from 'lucide-react'
import { useEffect } from 'react'

import { useLanguage } from '@/providers/LanguageProvider'

type ImageLightboxProps = {
  src: string | null
  onClose: () => void
}

// 클릭 시 확대 이미지 모달
const ImageLightbox = ({ src, onClose }: ImageLightboxProps) => {
  const { t } = useLanguage()

  useEffect(() => {
    if (!src) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [src, onClose])

  if (!src) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-6"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label={t('chat.close')}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <XIcon className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={t('chat.zoomedImage')}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] cursor-default object-contain"
      />
    </div>
  )
}

export default ImageLightbox
