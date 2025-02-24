import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Alice Johnson",
    role: "CEO, TechCorp",
    content: "StreamLine has revolutionized our workflow. It's an indispensable tool for our team.",
    avatar: "AJ",
  },
  {
    name: "Bob Smith",
    role: "CTO, InnovateCo",
    content: "The analytics features in StreamLine have given us invaluable insights into our processes.",
    avatar: "BS",
  },
  {
    name: "Carol Davis",
    role: "Operations Manager, GlobalFirm",
    content: "StreamLine's collaboration tools have significantly improved our team's productivity.",
    avatar: "CD",
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="container py-24">
      <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">What Our Customers Say</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{testimonial.name}</CardTitle>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{testimonial.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

