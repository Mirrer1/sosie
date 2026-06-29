export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

// 이미지 파일을 검증해 에러 메시지 반환
export const validateImage = (file: File): string | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'jpeg, png, webp 형식만 지원합니다'
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return '이미지는 5MB 이하만 가능합니다'
  }
  return null
}
