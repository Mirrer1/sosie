'use client'

import { useEffect, useState } from 'react'

// AI가 응답 중인지 헤더 버튼에서 구독
const useChatBusy = () => {
  const [busy, setBusy] = useState(false)

  // ChatRoot가 보내는 응답 상태 이벤트 수신
  useEffect(() => {
    const handler = (e: Event) => setBusy((e as CustomEvent<boolean>).detail)
    window.addEventListener('sosie:chat-busy', handler)
    return () => window.removeEventListener('sosie:chat-busy', handler)
  }, [])

  return busy
}

export default useChatBusy
