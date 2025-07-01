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
    <Card>
      <CardHeader>
        <CardTitle className="text-d5 text-white font-alexandria">Basics</CardTitle>
      </CardHeader>
      <CardContent>
      {Object.entries({ bio, lore, topics, adjectives }).filter(item => item[1].length).map(([title, list]) => (
        <div key={title}>
          <h2 className="text-d6 text-white font-alexandria">{capitalize(title)}</h2>
          {list.map((str, index) => (
            <p key={`${title}.${index}`} className="text-white font-alexandria">{str}</p>
          ))}
        </div>
      ))}
      </CardContent>
    </Card>
  )
}