import Footer from "./ChatFooter";
import Header from "./ChatHeader";
import Message from "./Message";
import { Card, CardFooter, CardHeader } from "~~/components/ui/card";
import { ScrollArea } from "~~/components/ui/scroll-area";

export default function ChatWindow() {
  return (
    <Card className="w-full max-w-[600px] rounded-2xl overflow-hidden">
      <CardHeader>
        <Header />
      </CardHeader>
      <ScrollArea className="h-[400px] border-b">
        <div className="p-4 grid gap-4">
          <Message
            message="Hey there! Just wanted to check in and see how the project is going."
            timestamp="10:30 AM"
            isSender={false}
          />
          <Message
            message="Hi! The project is going well, thanks for checking in. I'll send you an update later today."
            timestamp="10:32 AM"
            isSender={true}
          />
          <Message
            message="Sounds good, I'm looking forward to the update. Let me know if you need anything else!"
            timestamp="10:35 AM"
            isSender={false}
          />
        </div>
      </ScrollArea>
      <CardFooter>
        <Footer />
      </CardFooter>
    </Card>
  );
}
