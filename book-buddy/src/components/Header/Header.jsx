import GuestNavbar from "../navigation/Guest/GuestNavbar.jsx";
import RegisteredNav from "../navigation/Registered/RegisteredNav.jsx";
import "./Header.css";

export default function Header({
  variant = "guest",
  messageUnreadCount = 0,
  requestPendingCount = 0,
}) {
  if (variant === "user") {
    return (
      <RegisteredNav
        messageUnreadCount={messageUnreadCount}
        requestPendingCount={requestPendingCount}
      />
    );
  }
  return <GuestNavbar />;
}
