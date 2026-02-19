interface InfoHintProps {
  text: string;
}

export function InfoHint({ text }: InfoHintProps) {
  return (
    <span
      title={text}
      className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-app-border text-[10px] text-app-muted hover:border-app-accent hover:text-app-accent"
    >
      ?
    </span>
  );
}
