import { type DictKey } from '@/i18n/dictionaries'

// 스타일 저장값에 대응하는 사전 키
export const STYLE_LABEL_KEYS: Record<string, DictKey> = {
  캐주얼: 'style.casual',
  미니멀: 'style.minimal',
  스트릿: 'style.street',
  빈티지: 'style.vintage',
  베이직: 'style.basic',
  스포티: 'style.sporty',
  포멀: 'style.formal',
  아메카지: 'style.amekaji',
  클래식: 'style.classic',
  고프코어: 'style.gorpcore',
}

// 프리셋 브랜드 저장값에 대응하는 사전 키
export const BRAND_LABEL_KEYS: Record<string, DictKey> = {
  '무신사 스탠다드': 'brand.musinsaStandard',
  유니폼브릿지: 'brand.uniformBridge',
  디스이즈네버댓: 'brand.thisisneverthat',
  커버낫: 'brand.covernat',
  앤더슨벨: 'brand.anderssonBell',
  '아이앱 스튜디오': 'brand.iabStudio',
  아디다스: 'brand.adidas',
  나이키: 'brand.nike',
}
