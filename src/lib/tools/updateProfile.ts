import { tool } from 'ai'

import {
  type UpdateProfileInput,
  type UpdateProfileOutput,
  updateProfileInputSchema,
} from '@/types/tool'

// 입력을 변경 필드와 mode, reason으로 분리
export const buildProfileUpdate = (input: UpdateProfileInput): UpdateProfileOutput => {
  const { mode, reason, ...updated } = input
  return { updated, mode, reason }
}

// 프로필 변경 신호를 반환하는 Tool
export const updateProfile = tool({
  description:
    '사용자가 대화 중 자기 취향(스타일/브랜드/성별/사이즈/예산)을 흘리거나 명시적으로 바꾸고 싶다고 하면 호출하세요. 1회 호출에 변경된 필드만 담아 보내세요. 답변에는 "프로필에 반영했어요" 같이 짧게 언급하세요.',
  inputSchema: updateProfileInputSchema,
  execute: async (input) => buildProfileUpdate(input),
})
