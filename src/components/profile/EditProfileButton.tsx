'use client'

import { UserCogIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

// 프로필 수정 열기
const EditProfileButton = () => {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('sosie:open-profile'))
  }

  return (
    <Button variant="ghost" size="icon" aria-label="프로필 수정" onClick={handleClick}>
      <UserCogIcon className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  )
}

export default EditProfileButton
