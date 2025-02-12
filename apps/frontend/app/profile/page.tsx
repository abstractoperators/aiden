import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";

export default function Profile() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main>
        <Hero />
      </main>
      <Footer />
    </div>
  )
}