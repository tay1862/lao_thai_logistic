export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(30,95,211,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(62,130,231,0.14),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.94))]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),transparent)]" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-6 md:px-6">
        {children}
      </div>
    </div>
  )
}
