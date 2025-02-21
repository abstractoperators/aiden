import Header from "@/components/header"
import Footer from "@/components/footer"
import About from "@/components/about"

export default function AboutPage() {
  return (
    <div className="text-black flex flex-col items-center w-full min-h-screen bg-cover bg-right-bottom bg-no-repeat bg-[url(/brand_assets/background-sky.png)]">
      <Header />
      <main className="flex-1 flex flex-col justify-center items-center">
        <About />
      </main>
      <Footer />
    </div>
  )
}