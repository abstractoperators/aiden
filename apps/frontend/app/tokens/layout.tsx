import Footer from "@/components/footer"
import Header from "@/components/header"

export default function TokensLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col justify-between items-center w-full min-h-screen">
      <Header />
      {children}
      <Footer />
    </div>
  )
}