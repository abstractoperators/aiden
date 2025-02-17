import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

const team: {name: string, title: string, description: string, avatar: string}[] = []
//   {
//     name: "Kent Gang",
//     title: "Cnidarian",
//     description: "Likes to Sting",
//     avatar: "KG",
//   },
//   {
//     name: "Michael Deng",
//     title: "Barbell",
//     description: "Dense but Reliable",
//     avatar: "MD",
//   },
//   {
//     name: "Andrew Liang",
//     title: "Dance",
//     description: "Likes to Dance",
//     avatar: "AL",
//   },
//   {
//     name: "Cody Garrison",
//     title: "Incubator",
//     description: "Ever watched Aliens?",
//     avatar: "CG",
//   },
// ]

export default function About() {
  return (
    <section id="about" className="container py-24">
      <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
        About Us
      </h2>
      <p className="m-auto max-w-[800px]">
        Developed by <Link className="text-[#0566FC] dark:text-[#DAF506]" href="https://abop.ai/" target="_blank">
          Abstract Operators
        </Link> and powered by <Link className="text-[#0566FC] dark:text-[#DAF506]" href="https://www.sei.io/" target="_blank">
          Sei
        </Link>, AIDEN is an AI Agent Platform
        for users to create, integrate, interact with, and deploy a diverse ecosystem
        of AI Agents on the Sei blockchain with no-code/low-code UI/UX.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {team.map((contributor, index) => (
          <Card key={index}>
            <CardHeader>
              <Avatar>
                <AvatarFallback>{contributor.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{contributor.name}</CardTitle>
                <p className="text-sm text-gray-500">{contributor.title}</p>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{contributor.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}