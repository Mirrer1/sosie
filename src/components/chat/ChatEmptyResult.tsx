type ChatEmptyResultProps = {
  onSelect: (text: string) => void
  disabled?: boolean
}

const SUGGESTIONS = ['맨투맨 추천해줘', '코트 보여줘', '운동화 골라줘']

// 검색 결과가 없을 때 안내 화면
const ChatEmptyResult = ({ onSelect, disabled }: ChatEmptyResultProps) => {
  return (
    <div className="bg-card flex flex-col items-center gap-2 rounded-lg border p-5 text-center">
      <p className="text-sm">이 키워드로는 어울리는 옷을 못 찾았어요.</p>
      <p className="text-muted-foreground text-xs">다른 키워드로 다시 찾아볼까요?</p>
      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(s)}
            className="bg-background hover:bg-accent rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ChatEmptyResult
