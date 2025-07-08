import { Character } from "@/lib/character";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function BiographyCard({
  bio,
}: Character) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-d6">Biography</CardTitle>
      </CardHeader>
      <CardContent>
      {bio.length ? bio.map((str, index) => (
        <p
          className={
            index % 2 == 0 ?
            "text-black dark:text-white" :
            "text-anakiwa-darker dark:text-carnation-light"
          }
          key={`bio.${
            index}`}
        >
          {str}
        </p>
      )) : "N/A"}
      </CardContent>
    </Card>
  )
}