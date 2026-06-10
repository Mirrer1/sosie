import Link from 'next/link'

import ClearChatButton from '@/components/ClearChatButton'
import EditProfileButton from '@/components/EditProfileButton'
import ModeToggle from '@/components/ModeToggle'

const Header = () => {
  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Sosie
        </Link>
        <div className="flex items-center gap-1">
          <EditProfileButton />
          <ClearChatButton />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

export default Header
