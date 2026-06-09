import ChatComposer from '@/components/ChatComposer'
import ChatWelcome from '@/components/ChatWelcome'
import Header from '@/components/Header'

const Home = () => {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col overflow-auto">
          <ChatWelcome />
        </div>
        <ChatComposer />
      </main>
    </>
  )
}

export default Home
