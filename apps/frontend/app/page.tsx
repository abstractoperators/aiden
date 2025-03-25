import Header from "@/components/header"
import Hero from "@/components/hero"
import Footer from "@/components/footer"
import About from "@/components/about"

export default function Home() {
  return (
    <div className="text-black flex flex-col items-center w-full min-h-screen bg-cover bg-right-bottom bg-no-repeat bg-[url(/brand_assets/background-sky.png)]">
      <Header variant="landing" />
      <main className="flex-1 flex flex-col items-center gap-y-32">
        <Hero />
        <About />
      </main>
      <Footer variant="landing" />
    </div>
  )
}

