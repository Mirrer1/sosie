type ChatWelcomeProps = {
  onExampleClick: (text: string) => void
}

const SEED_EXAMPLES = ['청바지 추천해줘', '가을에 입을 셔츠 골라줘', '예산 안에서 코트 보여줘']

// 메시지 없을 때 환영 화면, 예시 칩 클릭 시 즉시 전송
const ChatWelcome = ({ onExampleClick }: ChatWelcomeProps) => {
  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          내 취향을 닮은 옷, 같이 골라드려요
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-sm md:text-base">
          스타일·브랜드·예산을 알려주시면
          <br />
          어울리는 옷을 골라드릴게요.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SEED_EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onExampleClick(ex)}
            className="bg-card hover:bg-accent rounded-full border px-3 py-1.5 text-sm transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ChatWelcome
