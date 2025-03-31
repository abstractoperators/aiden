import Header from "@/components/header"
import Hero from "@/components/hero"
import Footer from "@/components/footer"
import About from "@/components/about"

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <Header variant="landing" />
      <main className="flex-1 flex flex-col items-center gap-y-16">
        <Hero />
        <About />
      </main>
      <Footer variant="landing" />
    </div>
  )
}

