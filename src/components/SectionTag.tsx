interface SectionTagProps {
  children: React.ReactNode;
}

export function SectionTag({ children }: SectionTagProps) {
  return (
    <span className="inline-block px-3 py-1.5 rounded-lg bg-tag text-white text-xs font-medium">
      {children}
    </span>
  );
}
