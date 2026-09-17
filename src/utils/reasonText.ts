export type ReasonTextParts = {
  before: string
  link: string // 누르면 근거를 여는 부분
  after: string
}

// 사전 문구를 링크 구간으로 나누고 값 채우기
export const splitReasonText = (template: string, value = ''): ReasonTextParts => {
  const filled = template.replace('{value}', value)
  const matched = filled.match(/^(.*?)\[(.+?)\](.*)$/)
  return matched
    ? { before: matched[1], link: matched[2], after: matched[3] }
    : { before: filled, link: '', after: '' }
}
