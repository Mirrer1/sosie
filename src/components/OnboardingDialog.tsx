'use client'

import { type KeyboardEvent, useState } from 'react'

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
import { cn } from '@/lib/utils'
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
  const [step, setStep] = useState(1)
  const [styles, setStyles] = useState<string[]>(initialProfile?.styles ?? [])
  const [brands, setBrands] = useState<string[]>(initialProfile?.brands ?? [])
  const [size, setSize] = useState<Profile['size']>(initialProfile?.size)
  const [budget, setBudget] = useState<Profile['budget']>(initialProfile?.budget)
  const [brandInput, setBrandInput] = useState('')

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

  // 다음 또는 저장
  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
      return
    }
    onSave({ styles, brands, size, budget })
  }

  // 이전 단계
  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  // 이번 단계 값 비우고 다음
  const handleSkip = () => {
    if (step === 1) setStyles([])
    if (step === 2) setBrands([])
    if (step === 3) setSize(undefined)
    if (step === 4) setBudget(undefined)
    handleNext()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && '어떤 스타일 좋아하세요?'}
            {step === 2 && '선호하는 브랜드 있나요?'}
            {step === 3 && '평소 사이즈는?'}
            {step === 4 && '옷에 보통 얼마 쓰세요?'}
          </DialogTitle>
          <DialogDescription>
            {step}/{TOTAL_STEPS} · 다 선택 사항이에요. 나중에 헤더에서 수정할 수 있어요.
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
                  {s}
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
                    {b}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  onKeyDown={handleBrandKeyDown}
                  placeholder="다른 브랜드 직접 입력"
                />
                <Button type="button" onClick={addBrand} disabled={!brandInput.trim()}>
                  추가
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
                    {r.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleSkip}>
            건너뛰기
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handlePrev}>
                이전
              </Button>
            )}
            <Button type="button" onClick={handleNext}>
              {step === TOTAL_STEPS ? '저장' : '다음'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default OnboardingDialog
