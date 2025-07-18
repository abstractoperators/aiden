import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function TagCard({
  tags,
  title,
}: {
  tags: string[],
  title: string,
}) {
  const strippedTags = tags.filter(str => str.trim().length)
  return (
    <Card className="bg-panel border border-border shadow-lg">
      <CardHeader>
        <CardTitle className="text-d6 text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1">
      {
        strippedTags.length ?
        strippedTags
        .map((str, index) => (
          <Badge 
            variant="outline" 
            key={`${title}.${index}`}
            className="border-anakiwa text-foreground"
          >
            {str}
          </Badge>
        )) : <span className="text-muted-foreground">N/A</span>
      }
      </CardContent>
    </Card>
  )
}