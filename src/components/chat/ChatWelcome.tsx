'use client'

import { motion } from 'motion/react'

import { useLanguage } from '@/providers/LanguageProvider'

type ChatWelcomeProps = {
  onExampleClick: (text: string) => void
}

const CONTAINER_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
} as const

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const

// 메시지 없을 때 환영 화면을 보여주며 예시 칩 클릭 시 즉시 전송
const ChatWelcome = ({ onExampleClick }: ChatWelcomeProps) => {
  const { t } = useLanguage()
  const examples = [t('welcome.example1'), t('welcome.example2'), t('welcome.example3')]
  const subtitleLines = t('welcome.subtitle').split('\n')

  return (
    <motion.div
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate="show"
      className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center"
    >
      <motion.div variants={ITEM_VARIANTS} className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t('welcome.title')}</h1>
        <p className="text-muted-foreground mx-auto max-w-md text-sm md:text-base">
          {subtitleLines.map((line, i) => (
            <span key={line}>
              {line}
              {i < subtitleLines.length - 1 && <br />}
            </span>
          ))}
        </p>
      </motion.div>
      <motion.div variants={CONTAINER_VARIANTS} className="flex flex-wrap justify-center gap-2">
        {examples.map((ex) => (
          <motion.button
            key={ex}
            variants={ITEM_VARIANTS}
            type="button"
            onClick={() => onExampleClick(ex)}
            className="bg-card hover:bg-accent cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors"
          >
            {ex}
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  )
}

export default ChatWelcome
