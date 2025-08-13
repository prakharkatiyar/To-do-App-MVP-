export const metadata = { title: "Vercel ToDo Pro", description: "Local-first ToDo with recurrence, priorities, tags, notes, and streaks." };
import "./globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
