'use client'

import { ExternalLinkIcon, HeartIcon, MessageCircleIcon, SparklesIcon, XIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import ProductReasonFavoritesDialog from '@/components/product/ProductReasonFavoritesDialog'
import OnboardingDialog from '@/components/profile/OnboardingDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import useChatBusy from '@/hooks/useChatBusy'
import { type DictKey } from '@/i18n/dictionaries'
import { DEFAULT_LANGUAGE } from '@/i18n/languages'
import { GENDER_LABEL_KEYS, STYLE_LABEL_KEYS } from '@/i18n/profileLabels'
import { cn } from '@/lib/utils'
import { useExchangeRate } from '@/providers/ExchangeRateProvider'
import { useFavorites } from '@/providers/FavoritesProvider'
import { useLanguage } from '@/providers/LanguageProvider'
import { type MarketProduct } from '@/types/product'
import { type Profile } from '@/types/profile'
import { summarizeFavorites } from '@/utils/favorites'
import { type MatchReason, buildMatchReasons, favoritesForReason } from '@/utils/matchReasons'
import { loadProfile, saveProfile } from '@/utils/profile'
import { splitReasonText } from '@/utils/reasonText'

type ProductPreviewDialogProps = {
  product: MarketProduct | null
  onSelect: (product: MarketProduct) => void
  onClose: () => void
}

const SIMILAR_SLOTS = 5
const MOBILE_SIMILAR_SLOTS = 3
const SKELETON_LINE_WIDTHS = ['w-3/4', 'w-full', 'w-1/2']

const REASON_LABEL_KEYS: Record<MatchReason['key'], DictKey> = {
  style: 'reason.style',
  budget: 'reason.budget',
  brand: 'reason.brand',
  favoriteBrand: 'reason.favoriteBrand',
  favoriteStyle: 'reason.favoriteStyle',
  gender: 'reason.gender',
  favoritePrice: 'reason.favoritePrice',
}

// 추천 이유별 프로필 마법사 단계
const PROFILE_STEPS: Partial<Record<MatchReason['key'], number>> = {
  style: 1,
  brand: 2,
  gender: 3,
  budget: 4,
}

// 모바일에서 넘치는 비슷한 상품 칸 숨김
const slotClassName = (index: number) => (index >= MOBILE_SIMILAR_SLOTS ? 'hidden sm:block' : '')

// AI 태그, 추천 이유, 구매 링크, 비슷한 상품을 보여주는 고정 크기 미리보기
const ProductPreviewDialog = ({ product, onSelect, onClose }: ProductPreviewDialogProps) => {
  const { t, lang } = useLanguage()
  const { formatApprox } = useExchangeRate()
  const { favorites, isFavorite, toggleFavorite } = useFavorites()
  const busy = useChatBusy()
  const [similar, setSimilar] = useState<MarketProduct[] | null>(null)
  const [loadedImage, setLoadedImage] = useState<string | null>(null)
  const [profileEdit, setProfileEdit] = useState<{ profile: Profile | null; step: number } | null>(
    null,
  )
  const [reasonFavorites, setReasonFavorites] = useState<MarketProduct[] | null>(null)
  const cacheRef = useRef<Map<string, MarketProduct[]>>(new Map())

  const styleLabel = (style: string) =>
    STYLE_LABEL_KEYS[style] ? t(STYLE_LABEL_KEYS[style]) : style
  const approx = product ? formatApprox(product.price) : null
  const active = product ? isFavorite(product.id) : false
  const tags = product
    ? [
        ...(product.styles ?? []).map((style) => ({
          label: `#${styleLabel(style)}`,
          strong: true,
        })),
        ...[
          ...(lang === DEFAULT_LANGUAGE
            ? [product.subcategory, ...(product.colors ?? []), ...(product.materials ?? [])]
            : []),
          product.gender && GENDER_LABEL_KEYS[product.gender]
            ? t(GENDER_LABEL_KEYS[product.gender])
            : undefined,
        ]
          .filter((label): label is string => Boolean(label))
          .map((label) => ({ label, strong: false })),
      ]
    : []
  const profile = product ? loadProfile() : null
  const otherFavorites = product ? favorites.filter((fav) => fav.id !== product.id) : []
  const favoriteSignals = summarizeFavorites(otherFavorites)
  const reasons = product
    ? buildMatchReasons(product, profile, favoriteSignals).map((reason) => ({
        reason,
        parts: splitReasonText(
          t(REASON_LABEL_KEYS[reason.key]),
          reason.key === 'gender'
            ? t(GENDER_LABEL_KEYS[reason.value])
            : 'value' in reason
              ? styleLabel(reason.value)
              : '',
        ),
      }))
    : []
  const buyLabel = t('preview.buy')
  const favoriteLabel = active ? t('favorites.remove') : t('favorites.add')
  const isImageLoaded = !!product && loadedImage === product.imageUrl
  const similarSlots = (similar ?? []).slice(0, SIMILAR_SLOTS)
  const isSimilarEmpty = similar !== null && similar.length === 0

  // 이미지가 로드되면 페이드인
  const handleImageLoad = () => {
    if (product) setLoadedImage(product.imageUrl)
  }

  // 찜 토글
  const handleToggleFavorite = () => {
    if (product) toggleFavorite(product)
  }

  // 추천 이유 링크로 프로필 단계나 근거 찜 상품 열기
  const handleReasonClick = (reason: MatchReason) => {
    if (!product) return
    const step = PROFILE_STEPS[reason.key]
    if (step) {
      setProfileEdit({ profile: loadProfile(), step })
      return
    }
    setReasonFavorites(favoritesForReason(reason, product, favorites, favoriteSignals.priceRange))
  }

  // 프로필 저장 후 변경 이벤트 전달
  const handleProfileSave = (next: Profile) => {
    saveProfile(next)
    window.dispatchEvent(new CustomEvent('sosie:profile-changed'))
    setProfileEdit(null)
  }

  // 근거 찜 상품으로 미리보기 전환
  const handleReasonFavoriteSelect = (next: MarketProduct) => {
    setReasonFavorites(null)
    onSelect(next)
  }

  // 이 스타일로 더 찾아달라고 채팅에 보내고 닫기
  const handleAsk = () => {
    if (!product || busy) return
    const text = t('preview.askMessage').replace('{name}', `${product.brand} ${product.name}`)
    window.dispatchEvent(new CustomEvent('sosie:ask', { detail: text }))
    onClose()
  }

  // 상품이 바뀌면 비슷한 상품을 캐시 우선으로 조회
  useEffect(() => {
    if (!product) return
    const cached = cacheRef.current.get(product.id)
    if (cached) {
      setSimilar(cached)
      return
    }
    setSimilar(null)
    const ctrl = new AbortController()
    fetch(`/api/products/${encodeURIComponent(product.id)}/similar`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data: { products?: MarketProduct[] }) => {
        const products = data.products ?? []
        cacheRef.current.set(product.id, products)
        setSimilar(products)
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setSimilar([])
      })
    return () => ctrl.abort()
  }, [product])

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="block gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogClose
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="bg-background/80 absolute top-3 right-3 z-20 rounded-full backdrop-blur"
            />
          }
        >
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogClose>

        {product && (
          <motion.div
            key={product.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="grid grid-cols-[104px_1fr] gap-x-3 gap-y-3 p-4 sm:grid-cols-[300px_1fr] sm:grid-rows-[auto_1fr] sm:gap-x-5 sm:p-5">
              <div className="bg-muted relative size-[104px] overflow-hidden rounded-lg sm:row-span-2 sm:size-[300px]">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  onLoad={handleImageLoad}
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
                    isImageLoaded ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </div>

              <div className="h-[92px] min-w-0 pr-8">
                <p className="text-muted-foreground h-4 truncate text-xs leading-4">
                  {product.brand}
                </p>
                <DialogTitle className="mt-1 line-clamp-2 h-10 text-base leading-5 font-semibold">
                  {product.name}
                </DialogTitle>
                <p className="mt-1 h-7 truncate text-lg leading-7 font-semibold">
                  {product.price.toLocaleString()}
                  {t('currency.suffix')}
                  {approx && (
                    <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                      (≈ {approx})
                    </span>
                  )}
                </p>
              </div>

              <div className="col-span-2 flex h-[196px] min-w-0 flex-col sm:col-span-1 sm:col-start-2">
                <div className="flex h-[50px] flex-wrap content-start gap-1.5 overflow-hidden">
                  {tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={cn(
                        'h-[22px] rounded-full border px-2 text-xs leading-5',
                        tag.strong ? 'bg-accent font-medium' : 'text-muted-foreground',
                      )}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>

                <div className="bg-muted/40 mt-3 h-[84px] rounded-lg border p-2">
                  <p className="flex h-4 items-center gap-1.5 text-xs leading-4 font-medium">
                    <SparklesIcon className="h-3.5 w-3.5" />
                    {t('preview.reasons')}
                  </p>
                  {reasons.length > 0 ? (
                    <ul className="mt-1">
                      {reasons.map(({ reason, parts }) => (
                        <li
                          key={reason.key}
                          className="text-muted-foreground h-4 truncate text-xs leading-4"
                        >
                          · {parts.before}
                          {parts.link && (
                            <button
                              type="button"
                              onClick={() => handleReasonClick(reason)}
                              className="text-foreground cursor-pointer font-medium underline decoration-dotted underline-offset-2 hover:decoration-solid"
                            >
                              {parts.link}
                            </button>
                          )}
                          {parts.after}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground mt-1 line-clamp-3 text-xs leading-4">
                      {t('preview.reasonsEmpty')}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex h-10 gap-2">
                  <a
                    href={product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-primary-foreground flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-opacity hover:opacity-90"
                  >
                    <span className="truncate">{buyLabel}</span>
                    <ExternalLinkIcon className="h-4 w-4 shrink-0" />
                  </a>
                  <Button
                    variant="outline"
                    onClick={handleToggleFavorite}
                    aria-label={favoriteLabel}
                    aria-pressed={active}
                    className="size-10"
                  >
                    <HeartIcon className={cn('h-4 w-4', active && 'fill-red-500 text-red-500')} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex h-7 items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{t('preview.similar')}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAsk}
                  disabled={busy}
                  className="text-muted-foreground shrink-0"
                >
                  <MessageCircleIcon />
                  {t('preview.askSimilar')}
                </Button>
              </div>

              <div className="relative mt-2">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {Array.from({ length: SIMILAR_SLOTS }).map((_, i) => (
                    <div key={i} className={slotClassName(i)}>
                      {similar === null ? (
                        <>
                          <Skeleton className="aspect-square w-full rounded-lg" />
                          <div className="mt-1.5 flex flex-col">
                            {SKELETON_LINE_WIDTHS.map((width) => (
                              <div key={width} className="flex h-4 items-center">
                                <Skeleton className={cn('h-3', width)} />
                              </div>
                            ))}
                          </div>
                        </>
                      ) : similarSlots[i] ? (
                        <motion.button
                          type="button"
                          onClick={() => onSelect(similarSlots[i])}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          className="group block w-full text-left"
                        >
                          <div className="bg-muted aspect-square overflow-hidden rounded-lg border">
                            <img
                              src={similarSlots[i].imageUrl}
                              alt={similarSlots[i].name}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                          <p className="text-muted-foreground mt-1.5 h-4 truncate text-[11px] leading-4">
                            {similarSlots[i].brand}
                          </p>
                          <p className="h-4 truncate text-xs leading-4">{similarSlots[i].name}</p>
                          <p className="h-4 truncate text-xs leading-4 font-semibold">
                            {similarSlots[i].price.toLocaleString()}
                            {t('currency.suffix')}
                          </p>
                        </motion.button>
                      ) : (
                        <div aria-hidden className="invisible">
                          <div className="aspect-square w-full" />
                          <div className="mt-1.5 h-12" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {isSimilarEmpty && (
                  <p className="text-muted-foreground absolute inset-0 flex items-center justify-center text-xs">
                    {t('preview.similarEmpty')}
                  </p>
                )}
              </div>

              <p className="text-muted-foreground mt-2 h-4 truncate text-center text-[11px] leading-4">
                {t('preview.priceNote')}
              </p>
            </div>
          </motion.div>
        )}

        <OnboardingDialog
          open={!!profileEdit}
          initialProfile={profileEdit?.profile}
          initialStep={profileEdit?.step}
          onSave={handleProfileSave}
          onClose={() => setProfileEdit(null)}
        />
        <ProductReasonFavoritesDialog
          products={reasonFavorites}
          onSelect={handleReasonFavoriteSelect}
          onClose={() => setReasonFavorites(null)}
        />
      </DialogContent>
    </Dialog>
  )
}

export default ProductPreviewDialog
