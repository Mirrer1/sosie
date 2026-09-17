'use client'

import { useEffect, useState } from 'react'

// AI 응답 중 여부 구독
const useChatBusy = () => {
  const [busy, setBusy] = useState(false)

  // 응답 상태 이벤트 수신
  useEffect(() => {
    const handler = (e: Event) => setBusy((e as CustomEvent<boolean>).detail)
    window.addEventListener('sosie:chat-busy', handler)
    return () => window.removeEventListener('sosie:chat-busy', handler)
  }, [])

  return busy
}

export default useChatBusy
