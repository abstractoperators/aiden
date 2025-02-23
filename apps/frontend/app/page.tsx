import Header from "./components/header"
import Hero from "./components/hero"
import Footer from "./components/footer"

export default function Home() {
  return (
    <div className="text-black flex flex-col items-center w-full min-h-screen bg-cover bg-right-bottom bg-no-repeat bg-[url(/brand_assets/background-sky.png)]">
      <Header variant="landing" />
      <main className="flex-1 flex flex-col justify-center items-center">
        <Hero />
      </main>
      <Footer variant="landing" />
    </div>
  )
}

