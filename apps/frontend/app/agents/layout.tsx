import Header from "@/components/header"

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center w-full min-h-screen">
      <Header />
      {children}
    </div>
  )
}