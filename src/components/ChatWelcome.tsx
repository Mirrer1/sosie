const SEED_EXAMPLES = [
  '발마칸 코트 추천해줘',
  '와이드 진 요즘 트렌드 알려줘',
  '이런 옷 비슷한 거 찾아줘',
]

const ChatWelcome = () => {
  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          닮은 옷, 다 모아드려요
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-sm md:text-base">
          트렌드 따라 비슷한 옷이 여러 브랜드에서 나올 때,
          <br />
          깔끔하게 비교하고 추천받으세요.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SEED_EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
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
