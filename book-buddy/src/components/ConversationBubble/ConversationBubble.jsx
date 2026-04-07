import "./ConversationBubble.css";

export default function ConversationBubble({
  align = "left",
  text,
  timestamp,
  senderLabel,
}) {
  const isRight = align === "right";
  return (
    <div
      className={`conversation-bubble-row ${
        isRight ? "conversation-bubble-row--right" : "conversation-bubble-row--left"
      }`.trim()}
    >
      <div
        className={`conversation-bubble ${
          isRight ? "conversation-bubble--right" : "conversation-bubble--left"
        }`.trim()}
      >
        {senderLabel && !isRight && (
          <p className="conversation-bubble-sender">{senderLabel}</p>
        )}
        <p className="conversation-bubble-text">{text}</p>
        {timestamp && (
          <p
            className={`conversation-bubble-time ${
              isRight ? "conversation-bubble-time--right" : ""
            }`.trim()}
          >
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}
