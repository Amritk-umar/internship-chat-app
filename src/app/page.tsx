export default function Home() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <div className="rounded-full bg-gray-100 p-4">
        <span className="text-4xl">👋</span>
      </div>
      <h2 className="text-2xl font-bold">Welcome to Team Chat</h2>
      <p className="text-muted-foreground">Select a channel from the sidebar to start chatting.</p>
    </div>
  );
}