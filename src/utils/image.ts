export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

// 이미지 파일을 검증해 에러 코드 반환
export const validateImage = (file: File): 'type' | 'size' | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'type'
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return 'size'
  }
  return null
}
