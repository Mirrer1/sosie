'use client'

import { HeartIcon } from 'lucide-react'
import { useState } from 'react'

import FavoritesDialog from '@/components/product/FavoritesDialog'
import { useFavorites } from '@/components/product/FavoritesProvider'
import { Button } from '@/components/ui/button'

// 헤더의 찜 목록 열기 버튼, 개수 뱃지 포함
const FavoritesButton = () => {
  const { favorites } = useFavorites()
  const [open, setOpen] = useState(false)
  const count = favorites.length

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="찜 목록"
        onClick={() => setOpen(true)}
        className="relative"
      >
        <HeartIcon className="h-[1.2rem] w-[1.2rem]" />
        {count > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
            {count}
          </span>
        )}
      </Button>
      <FavoritesDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export default FavoritesButton
