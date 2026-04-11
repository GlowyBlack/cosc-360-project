import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import ConversationBubble from "../../../book-buddy/src/components/ConversationBubble/ConversationBubble.jsx";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: async () => ({}) })
  );
});

describe("ConversationBubble", () => {
  it("renders the message text", () => {
    render(<ConversationBubble text="Hello there!" align="left" />);
    expect(screen.getByText("Hello there!")).toBeInTheDocument();
  });

  it("renders the timestamp when provided", () => {
    render(<ConversationBubble text="Hi" timestamp="3:45 PM" align="left" />);
    expect(screen.getByText("3:45 PM")).toBeInTheDocument();
  });

  it("does not render a timestamp when not provided", () => {
    render(<ConversationBubble text="Hi" align="left" />);
    expect(screen.queryByText(/PM|AM/)).not.toBeInTheDocument();
  });

  it("shows sender label on left-aligned bubbles", () => {
    render(
      <ConversationBubble text="Hey" align="left" senderLabel="@jane" />
    );
    expect(screen.getByText("@jane")).toBeInTheDocument();
  });

  it("does not show sender label on right-aligned bubbles", () => {
    render(
      <ConversationBubble text="Hey" align="right" senderLabel="@jane" />
    );
    expect(screen.queryByText("@jane")).not.toBeInTheDocument();
  });

  it("applies left alignment class for received messages", () => {
    const { container } = render(
      <ConversationBubble text="Received" align="left" />
    );
    expect(container.firstChild).toHaveClass("conversation-bubble-row--left");
  });

  it("applies right alignment class for sent messages", () => {
    const { container } = render(
      <ConversationBubble text="Sent" align="right" />
    );
    expect(container.firstChild).toHaveClass("conversation-bubble-row--right");
  });

  it("defaults to left alignment when align prop is not provided", () => {
    const { container } = render(<ConversationBubble text="Default" />);
    expect(container.firstChild).toHaveClass("conversation-bubble-row--left");
  });
});