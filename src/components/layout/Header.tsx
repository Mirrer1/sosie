import ClearChatButton from '@/components/chat/ClearChatButton'
import LanguageToggle from '@/components/layout/LanguageToggle'
import ModeToggle from '@/components/layout/ModeToggle'
import FavoritesButton from '@/components/product/FavoritesButton'
import EditProfileButton from '@/components/profile/EditProfileButton'

const Header = () => {
  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <span className="cursor-default text-lg font-semibold tracking-tight select-none">
          Sosie
        </span>
        <div className="flex items-center gap-1">
          <FavoritesButton />
          <EditProfileButton />
          <ClearChatButton />
          <LanguageToggle />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

export default Header
