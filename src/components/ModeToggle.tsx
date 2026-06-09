'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

const ModeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme()

  const handleToggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button variant="ghost" size="icon" aria-label="테마 변경" onClick={handleToggle}>
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  )
}

export default ModeToggle
