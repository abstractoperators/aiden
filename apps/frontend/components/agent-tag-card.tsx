import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function TagCard({
  tags,
  title,
}: {
  tags: string[],
  title: string,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-d6">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1">
      {tags.length ? tags.map((str, index) => (
        <Badge variant="outline" key={`${title}.${index}`}>{str}</Badge>
      )) : "N/A"}
      </CardContent>
    </Card>
  )
}