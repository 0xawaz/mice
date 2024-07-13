import { PaperclipIcon, SendIcon } from "./Icons";
import { Button } from "~~/components/ui/Button";
import { Input } from "~~/components/ui/Input";

const ChatFooter = () => (
  <div className="bg-muted px-4 py-3 flex items-center gap-2">
    <Input placeholder="Type your message..." className="flex-1 bg-transparent focus:ring-0 focus:border-0" />
    <Button variant="ghost" size="icon" className="rounded-full">
      <PaperclipIcon className="h-5 w-5" />
    </Button>
    <Button variant="ghost" size="icon" className="rounded-full">
      <SendIcon className="h-5 w-5" />
    </Button>
  </div>
);

export default ChatFooter;
