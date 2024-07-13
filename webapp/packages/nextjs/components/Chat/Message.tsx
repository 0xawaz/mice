import UserAvatar from "./Avatar";

const Message = ({ message, timestamp, isSender }) => (
  <div className={`flex items-start gap-3 ${isSender ? "justify-end" : ""}`}>
    {!isSender && <UserAvatar src="/placeholder-user.jpg" fallback="CN" />}
    <div
      className={`bg-${isSender ? "primary" : "muted"} rounded-lg p-3 max-w-[75%] relative ${
        isSender ? "text-primary-foreground" : ""
      }`}
    >
      <div className="text-sm">{message}</div>
      <div className={`text-xs ${isSender ? "text-primary-foreground/80" : "text-muted-foreground"} mt-1`}>
        {timestamp}
      </div>
      <div className="absolute top-0 left-0 w-full h-full rounded-lg bg-gradient-to-br from-[#8e2de2] to-[#4a00e0] opacity-10 pointer-events-none" />
    </div>
  </div>
);

export default Message;
