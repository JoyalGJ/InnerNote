import { Inter as FontSans } from "next/font/google";
import "./styles/globals.css"; 
import { cn } from "@/lib/utils";
import { AuthProvider } from "../providers/AuthProvider";
import { Navbar } from "../components/Navbar";
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "InnerNote - AI Diary",
  description: "Your intelligent personal journal.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <AuthProvider>
          <Navbar />
        <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}