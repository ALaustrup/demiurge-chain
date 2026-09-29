/**
 * World Layout
 * 
 * Minimal layout for the immersive world - no header bar.
 */

export default function WorldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {children}
    </div>
  );
}
