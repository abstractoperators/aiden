import Header from "./components/header"
import Hero from "./components/hero"
import About from "./components/about"
import Footer from "./components/footer"

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-cover bg-right-bottom bg-no-repeat bg-[url(/brand_assets/background-sky.png)]">
      <Header />
      <main className="flex-1">
        <Hero />
        <About />
      </main>
      <Footer />
    </div>
  )
}

