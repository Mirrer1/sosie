import { type LanguageCode } from '@/i18n/languages'

// UI 문구 사전 키
export type DictKey =
  | 'header.language'
  | 'welcome.title'
  | 'welcome.subtitle'
  | 'welcome.example1'
  | 'welcome.example2'
  | 'welcome.example3'

// 언어별 UI 문구 사전
export const dictionaries: Partial<Record<LanguageCode, Record<DictKey, string>>> = {
  ko: {
    'header.language': '언어',
    'welcome.title': '내 취향을 닮은 옷, 같이 골라드려요',
    'welcome.subtitle': '스타일과 브랜드, 예산을 알려주시면\n어울리는 옷을 골라드릴게요.',
    'welcome.example1': '여름에 입기 좋은 반팔티 추천해줘',
    'welcome.example2': '캐주얼한 와이드 데님 보여줘',
    'welcome.example3': '5만원대 반바지 골라줘',
  },
  en: {
    'header.language': 'Language',
    'welcome.title': 'Clothes that match your taste, picked together',
    'welcome.subtitle':
      "Tell me your style, brands, and budget\nand I'll pick pieces that suit you.",
    'welcome.example1': 'Recommend a short-sleeve tee for summer',
    'welcome.example2': 'Show me casual wide denim',
    'welcome.example3': 'Pick shorts around 50,000 won',
  },
}
