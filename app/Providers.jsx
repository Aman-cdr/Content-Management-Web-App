"use client";

import { ContentProvider } from "@/context/ContentContext";
import { ThemeProvider } from "@/context/ThemeContext";
import NextTopLoader from "nextjs-toploader";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
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
      <ContentProvider>{children}</ContentProvider>
    </ThemeProvider>
  );
}
