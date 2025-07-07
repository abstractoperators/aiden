import { capitalize } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./ui/card";
import { Character } from "@/lib/character";

export default function DescriptionCard({
  bio,
  lore,
  topics,
  adjectives,
}: Character) {
  return (
    <Card className="bg-panel border">
      <CardHeader>
        <CardTitle className="text-2xl text-white">Basics</CardTitle>
      </CardHeader>
      <CardContent>
      {Object.entries({ bio, lore, topics, adjectives }).filter(item => item[1].length).map(([title, list]) => (
        <div key={title}>
          <h2 className="text-xl text-white">{capitalize(title)}</h2>
          {list.map((str, index) => (
            <p key={`${title}.${index}`} className="text-white">{str}</p>
          ))}
        </div>
      ))}
      </CardContent>
    </Card>
  )
}