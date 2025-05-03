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
        <CardTitle className="text-d5">Basics</CardTitle>
      </CardHeader>
      <CardContent>
      {Object.entries({ bio, lore, topics, adjectives }).filter(item => item[1].length).map(([title, list]) => (
        <div key={title}>
          <h2 className="font-sans text-d6">{capitalize(title)}</h2>
          {list.map((str, index) => (
            <p key={`${title}.${index}`}>{str}</p>
          ))}
        </div>
      ))}
      </CardContent>
    </Card>
  )
}