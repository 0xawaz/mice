import { Avatar, AvatarFallback, AvatarImage } from "~~/components/ui/avatar";

const UserAvatar = ({ src, fallback }) => (
  <Avatar>
    <AvatarImage src={src} />
    <AvatarFallback>{fallback}</AvatarFallback>
  </Avatar>
);

export default UserAvatar;
