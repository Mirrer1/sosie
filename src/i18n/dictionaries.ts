import { type LanguageCode } from '@/i18n/languages'

// UI 문구 사전 키
export type DictKey =
  | 'header.language'
  | 'welcome.title'
  | 'welcome.subtitle'
  | 'welcome.example1'
  | 'welcome.example2'
  | 'welcome.example3'
  | 'chat.imageZoom'
  | 'chat.attachedImage'
  | 'chat.previewImage'
  | 'chat.removeImage'
  | 'chat.uploadImage'
  | 'chat.send'
  | 'chat.placeholder'
  | 'chat.scrollDown'
  | 'chat.dropImage'
  | 'chat.thinking'
  | 'chat.copy'
  | 'chat.copySuccess'
  | 'chat.copyError'
  | 'chat.regenerate'
  | 'chat.close'
  | 'chat.zoomedImage'
  | 'toolError.title'
  | 'toolError.desc'
  | 'toolError.retry'
  | 'emptyResult.title'
  | 'emptyResult.desc'
  | 'emptyResult.suggestion1'
  | 'emptyResult.suggestion2'
  | 'emptyResult.suggestion3'
  | 'clearChat.label'
  | 'clearChat.desc'
  | 'clearChat.cancel'
  | 'clearChat.confirm'
  | 'toolStatus.searchProducts'
  | 'toolStatus.comparePrices'
  | 'toolStatus.parseProductUrl'
  | 'toolStatus.updateProfile'
  | 'toolStatus.pending'
  | 'toolStatus.error'
  | 'toolStatus.done'
  | 'image.errorType'
  | 'image.errorSize'

// 언어별 UI 문구 사전
export const dictionaries: Partial<Record<LanguageCode, Record<DictKey, string>>> = {
  ko: {
    'header.language': '언어',
    'welcome.title': '내 취향을 닮은 옷, 같이 골라드려요',
    'welcome.subtitle': '스타일과 브랜드, 예산을 알려주시면\n어울리는 옷을 골라드릴게요.',
    'welcome.example1': '여름에 입기 좋은 반팔티 추천해줘',
    'welcome.example2': '캐주얼한 와이드 데님 보여줘',
    'welcome.example3': '5만원대 반바지 골라줘',
    'chat.imageZoom': '이미지 확대',
    'chat.attachedImage': '첨부 이미지',
    'chat.previewImage': '첨부 이미지 미리보기',
    'chat.removeImage': '이미지 제거',
    'chat.uploadImage': '이미지 업로드',
    'chat.send': '보내기',
    'chat.placeholder': '찾고 싶은 옷을 자유롭게 알려주세요',
    'chat.scrollDown': '맨 아래로',
    'chat.dropImage': '이미지를 여기에 놓으세요',
    'chat.thinking': '생각 중...',
    'chat.copy': '복사',
    'chat.copySuccess': '복사했어요',
    'chat.copyError': '복사하지 못했어요',
    'chat.regenerate': '다시 생성',
    'chat.close': '닫기',
    'chat.zoomedImage': '확대 이미지',
    'toolError.title': '검색 중 문제가 생겼어요.',
    'toolError.desc': '잠시 후 다시 시도해 주세요.',
    'toolError.retry': '다시 시도',
    'emptyResult.title': '이 키워드로는 어울리는 옷을 못 찾았어요.',
    'emptyResult.desc': '다른 키워드로 다시 찾아볼까요?',
    'emptyResult.suggestion1': '맨투맨 추천해줘',
    'emptyResult.suggestion2': '코트 보여줘',
    'emptyResult.suggestion3': '운동화 골라줘',
    'clearChat.label': '대화 지우기',
    'clearChat.desc': '현재 대화 내용을 모두 지웁니다. 되돌릴 수 없어요.',
    'clearChat.cancel': '취소',
    'clearChat.confirm': '지우기',
    'toolStatus.searchProducts': '상품 검색',
    'toolStatus.comparePrices': '판매처 가격 비교',
    'toolStatus.parseProductUrl': 'URL 정보 추출',
    'toolStatus.updateProfile': '프로필 업데이트',
    'toolStatus.pending': ' 중...',
    'toolStatus.error': ' 실패',
    'toolStatus.done': ' 완료',
    'image.errorType': 'jpeg, png, webp 형식만 지원합니다',
    'image.errorSize': '이미지는 5MB 이하만 가능합니다',
  },
  en: {
    'header.language': 'Language',
    'welcome.title': 'Clothes that match your taste, picked together',
    'welcome.subtitle':
      "Tell me your style, brands, and budget\nand I'll pick pieces that suit you.",
    'welcome.example1': 'Recommend a short-sleeve tee for summer',
    'welcome.example2': 'Show me casual wide denim',
    'welcome.example3': 'Pick shorts around 50,000 won',
    'chat.imageZoom': 'Zoom image',
    'chat.attachedImage': 'Attached image',
    'chat.previewImage': 'Attached image preview',
    'chat.removeImage': 'Remove image',
    'chat.uploadImage': 'Upload image',
    'chat.send': 'Send',
    'chat.placeholder': "Tell me freely what you're looking for",
    'chat.scrollDown': 'Scroll to bottom',
    'chat.dropImage': 'Drop the image here',
    'chat.thinking': 'Thinking...',
    'chat.copy': 'Copy',
    'chat.copySuccess': 'Copied',
    'chat.copyError': 'Could not copy',
    'chat.regenerate': 'Regenerate',
    'chat.close': 'Close',
    'chat.zoomedImage': 'Zoomed image',
    'toolError.title': 'Something went wrong during the search.',
    'toolError.desc': 'Please try again in a moment.',
    'toolError.retry': 'Try again',
    'emptyResult.title': "I couldn't find matching clothes for this keyword.",
    'emptyResult.desc': 'Shall we try a different keyword?',
    'emptyResult.suggestion1': 'Recommend a sweatshirt',
    'emptyResult.suggestion2': 'Show me coats',
    'emptyResult.suggestion3': 'Pick sneakers',
    'clearChat.label': 'Clear chat',
    'clearChat.desc': "This clears the entire conversation and can't be undone.",
    'clearChat.cancel': 'Cancel',
    'clearChat.confirm': 'Clear',
    'toolStatus.searchProducts': 'Product search',
    'toolStatus.comparePrices': 'Price comparison',
    'toolStatus.parseProductUrl': 'URL parsing',
    'toolStatus.updateProfile': 'Profile update',
    'toolStatus.pending': '...',
    'toolStatus.error': ' failed',
    'toolStatus.done': ' complete',
    'image.errorType': 'Only jpeg, png, and webp formats are supported',
    'image.errorSize': 'Images must be 5MB or smaller',
  },
}
