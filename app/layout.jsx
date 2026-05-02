import "./globals.css";
import NextAuthSessionProvider from "./components/SessionProvider";
import { ContentProvider } from "@/context/ContentContext";
import NextTopLoader from 'nextjs-toploader';

export const metadata = {
  title: "Creator CMS - AI-Powered Content Management",
  description: "The ultimate dashboard for modern content creators.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <NextTopLoader
          color="linear-gradient(90deg, #6366F1, #8B5CF6, #6366F1)"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #6366F1, 0 0 5px #8B5CF6"
        />
        <NextAuthSessionProvider>
          <ContentProvider>
            {children}
          </ContentProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
