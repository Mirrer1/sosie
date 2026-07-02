'use client'

import { type KeyboardEvent, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { BRAND_LABEL_KEYS, BUDGET_LABEL_KEYS, STYLE_LABEL_KEYS } from '@/i18n/profileLabels'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/providers/LanguageProvider'
import {
  BUDGET_RANGES,
  POPULAR_BRANDS,
  type Profile,
  SIZE_OPTIONS,
  STYLE_OPTIONS,
} from '@/types/profile'

type OnboardingDialogProps = {
  open: boolean
  initialProfile?: Profile | null
  onSave: (profile: Profile) => void
  onClose: () => void
}

const TOTAL_STEPS = 4

// 칩 토글
const toggle = (arr: string[], v: string): string[] =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]

// 첫 진입 또는 헤더 버튼에서 호출되는 프로필 마법사
const OnboardingDialog = ({ open, initialProfile, onSave, onClose }: OnboardingDialogProps) => {
  const { t } = useLanguage()
  const [step, setStep] = useState(1)
  const [styles, setStyles] = useState<string[]>(initialProfile?.styles ?? [])
  const [brands, setBrands] = useState<string[]>(initialProfile?.brands ?? [])
  const [size, setSize] = useState<Profile['size']>(initialProfile?.size)
  const [budget, setBudget] = useState<Profile['budget']>(initialProfile?.budget)
  const [brandInput, setBrandInput] = useState('')

  // 열릴 때마다 현재 프로필로 state 재동기화
  useEffect(() => {
    if (!open) return
    setStyles(initialProfile?.styles ?? [])
    setBrands(initialProfile?.brands ?? [])
    setSize(initialProfile?.size)
    setBudget(initialProfile?.budget)
    setStep(1)
    setBrandInput('')
  }, [open, initialProfile])

  // 자유 입력 브랜드 추가
  const addBrand = () => {
    const trimmed = brandInput.trim()
    if (!trimmed || brands.includes(trimmed)) return
    setBrands([...brands, trimmed])
    setBrandInput('')
  }

  // Enter 시 브랜드 추가
  const handleBrandKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addBrand()
    }
  }

  // 다음 단계
  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1)
  }

  // 이전 단계
  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  // 현재까지 고른 값으로 즉시 저장
  const handleSave = () => {
    onSave({ styles, brands, size, budget })
  }

  // 이번 단계 값 비우고 다음
  const handleSkip = () => {
    if (step === 1) setStyles([])
    if (step === 2) setBrands([])
    if (step === 3) setSize(undefined)
    handleNext()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && t('onboarding.step1Title')}
            {step === 2 && t('onboarding.step2Title')}
            {step === 3 && t('onboarding.step3Title')}
            {step === 4 && t('onboarding.step4Title')}
          </DialogTitle>
          <DialogDescription>
            {step}/{TOTAL_STEPS} · {t('onboarding.optional')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyles(toggle(styles, s))}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    styles.includes(s)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-accent',
                  )}
                >
                  {STYLE_LABEL_KEYS[s] ? t(STYLE_LABEL_KEYS[s]) : s}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {POPULAR_BRANDS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrands(toggle(brands, b))}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      brands.includes(b)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-accent',
                    )}
                  >
                    {BRAND_LABEL_KEYS[b] ? t(BRAND_LABEL_KEYS[b]) : b}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  onKeyDown={handleBrandKeyDown}
                  placeholder={t('onboarding.brandPlaceholder')}
                />
                <Button type="button" onClick={addBrand} disabled={!brandInput.trim()}>
                  {t('onboarding.add')}
                </Button>
              </div>
              {brands.filter((b) => !POPULAR_BRANDS.includes(b)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {brands
                    .filter((b) => !POPULAR_BRANDS.includes(b))
                    .map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBrands(brands.filter((x) => x !== b))}
                        className="bg-primary text-primary-foreground border-primary rounded-full border px-3 py-1.5 text-sm"
                      >
                        {b} ✕
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(size === s ? undefined : s)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm transition-colors',
                    size === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card hover:bg-accent',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-wrap gap-2">
              {BUDGET_RANGES.map((r) => {
                const selected = budget?.min === r.min && budget?.max === r.max
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => setBudget(selected ? undefined : { min: r.min, max: r.max })}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card hover:bg-accent',
                    )}
                  >
                    {t(BUDGET_LABEL_KEYS[r.min])}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {step < TOTAL_STEPS ? (
            <Button type="button" variant="ghost" onClick={handleSkip}>
              {t('onboarding.skip')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handlePrev}>
                {t('onboarding.prev')}
              </Button>
            )}
            {step < TOTAL_STEPS && (
              <Button type="button" variant="outline" onClick={handleNext}>
                {t('onboarding.next')}
              </Button>
            )}
            <Button type="button" onClick={handleSave}>
              {t('onboarding.save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingDialog
