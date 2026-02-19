interface InfoHintProps {
  text: string;
}

export function InfoHint({ text }: InfoHintProps) {
  return (
    <span
      title={text}
      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-app-border text-[11px] font-semibold text-app-muted transition-colors hover:border-app-accent hover:text-app-accent"
    >
      ?
    </span>
  );
}
