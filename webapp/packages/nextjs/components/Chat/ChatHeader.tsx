// Header.jsx
import UserAvatar from "./Avatar";
import { FileIcon, ImageIcon, MoveHorizontalIcon, SettingsIcon } from "./Icons";
import { Button } from "~~/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~~/components/ui/dropdown-menu.tsx";

const ChatHeader = () => (
  <div className="flex items-center gap-4 bg-muted px-4 py-3">
    <UserAvatar src="/placeholder-user.jpg" fallback="CN" />
    <div className="flex-1 grid gap-0.5">
      <div className="font-medium">Olivia Davis</div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span>Online</span>
      </div>
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoveHorizontalIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <FileIcon className="mr-2 h-4 w-4" />
          Attach File
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ImageIcon className="mr-2 h-4 w-4" />
          Attach Image
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <SettingsIcon className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

export default ChatHeader;
