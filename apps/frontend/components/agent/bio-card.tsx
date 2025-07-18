import { Character } from "@/lib/schemas/character";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function BiographyCard({
  bio,
}: Character) {
  return (
    <Card className="bg-panel border border-border shadow-lg">
      <CardHeader>
        <CardTitle className="text-d6 text-foreground">Biography</CardTitle>
      </CardHeader>
      <CardContent>
      {bio.length ? bio.map((str, index) => (
        <p
          className={
            index % 2 == 0 ?
            "text-foreground" :
            "text-anakiwa-darker dark:text-anakiwa-light"
          }
          key={`bio.${
            index}`}
        >
          {str}
        </p>
      )) : <span className="text-muted-foreground">N/A</span>}
      </CardContent>
    </Card>
  )
}