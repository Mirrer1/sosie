import { type FavoriteSignals } from '@/types/favorites'
import { type MarketProduct } from '@/types/product'
import { type Profile } from '@/types/profile'

const MAX_REASONS = 3

export type MatchReason =
  | { key: 'style'; value: string }
  | { key: 'budget' }
  | { key: 'brand' }
  | { key: 'gender'; value: string }
  | { key: 'favoriteBrand' }
  | { key: 'favoriteStyle'; value: string }
  | { key: 'favoritePrice' }

// 공백을 없애고 소문자로 정규화
const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase()

// 상품이 프로필과 맞는 이유
const profileReasons = (product: MarketProduct, profile?: Profile | null): MatchReason[] => {
  if (!profile) return []
  const reasons: MatchReason[] = []

  const style = product.styles?.find((s) => profile.styles?.includes(s))
  if (style) reasons.push({ key: 'style', value: style })

  const { min, max } = profile.budget ?? {}
  if (
    (min !== undefined || max !== undefined) &&
    (min === undefined || product.price >= min) &&
    (max === undefined || product.price <= max)
  ) {
    reasons.push({ key: 'budget' })
  }

  if (profile.brands?.some((b) => normalize(b) === normalize(product.brand))) {
    reasons.push({ key: 'brand' })
  }

  if (profile.gender && product.gender === profile.gender) {
    reasons.push({ key: 'gender', value: profile.gender })
  }

  return reasons
}

// 프로필과 겹치지 않는 찜 기준 이유
const favoriteReasons = (
  product: MarketProduct,
  profile?: Profile | null,
  favorites?: FavoriteSignals | null,
): MatchReason[] => {
  if (!favorites) return []
  const reasons: MatchReason[] = []
  const brand = normalize(product.brand)

  const isProfileBrand = profile?.brands?.some((b) => normalize(b) === brand)
  if (!isProfileBrand && favorites.brands.some((b) => normalize(b) === brand)) {
    reasons.push({ key: 'favoriteBrand' })
  }

  const style = product.styles?.find(
    (s) => favorites.styles.includes(s) && !profile?.styles?.includes(s),
  )
  if (style) reasons.push({ key: 'favoriteStyle', value: style })

  const hasBudget = profile?.budget?.min !== undefined || profile?.budget?.max !== undefined
  const range = favorites.priceRange
  if (!hasBudget && range && product.price >= range.min && product.price <= range.max) {
    reasons.push({ key: 'favoritePrice' })
  }

  return reasons
}

// 찜 이유를 누르면 보여줄 근거 찜 상품 추출
export const favoritesForReason = (
  reason: MatchReason,
  product: MarketProduct,
  favorites: MarketProduct[],
  priceRange?: FavoriteSignals['priceRange'],
): MarketProduct[] => {
  const others = favorites.filter((fav) => fav.id !== product.id)
  if (reason.key === 'favoriteBrand') {
    return others.filter((fav) => normalize(fav.brand) === normalize(product.brand))
  }
  if (reason.key === 'favoriteStyle') {
    return others.filter((fav) => fav.styles?.includes(reason.value))
  }
  if (reason.key === 'favoritePrice' && priceRange) {
    return others.filter((fav) => fav.price >= priceRange.min && fav.price <= priceRange.max)
  }
  return []
}

// 프로필 이유를 먼저 두고 최대 3개 추출
export const buildMatchReasons = (
  product: MarketProduct,
  profile?: Profile | null,
  favorites?: FavoriteSignals | null,
): MatchReason[] =>
  [...profileReasons(product, profile), ...favoriteReasons(product, profile, favorites)].slice(
    0,
    MAX_REASONS,
  )
