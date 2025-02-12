import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserProfile } from "@dynamic-labs/sdk-react-core";

export default function UserMenu({ user } : { user : UserProfile }) {
    return (
        <Avatar>
            <AvatarFallback>AB</AvatarFallback>
        </Avatar>
    )
}
