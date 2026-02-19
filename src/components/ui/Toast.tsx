interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-panel border border-app-border bg-app-elevated px-3 py-2 text-sm text-app-text shadow-lg">
      {message}
    </div>
  );
}
