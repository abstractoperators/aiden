import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, BarChart, Users, Lock } from "lucide-react"

const features = [
  {
    title: "Lightning Fast",
    description: "Our platform is optimized for speed, ensuring quick load times and responsive interactions.",
    icon: Zap,
  },
  {
    title: "Advanced Analytics",
    description: "Gain valuable insights with our comprehensive analytics and reporting tools.",
    icon: BarChart,
  },
  {
    title: "Team Collaboration",
    description: "Seamlessly work together with your team members in real-time.",
    icon: Users,
  },
  {
    title: "Enterprise-Grade Security",
    description: "Rest easy knowing your data is protected by state-of-the-art security measures.",
    icon: Lock,
  },
]

export default function Features() {
  return (
    <section id="features" className="container py-24">
      <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Key Features</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <feature.icon className="h-10 w-10 mb-2" />
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

