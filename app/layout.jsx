import "./globals.css";
import NextAuthSessionProvider from "./components/SessionProvider";
import { ContentProvider } from "@/context/ContentContext";
import { ThemeProvider } from "@/context/ThemeContext";
import NextTopLoader from 'nextjs-toploader';

export const metadata = {
  title: "Creator CMS - AI-Powered Content Management",
  description: "The ultimate dashboard for modern content creators.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Blocking script: applies stored theme vars before first paint — prevents flash on reload */}
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  var THEMES={indigo:{p:"#6366F1",s:"#8B5CF6"},ocean:{p:"#0EA5E9",s:"#06B6D4"},emerald:{p:"#10B981",s:"#34D399"},rose:{p:"#F43F5E",s:"#FB7185"},amber:{p:"#F59E0B",s:"#FBBF24"},dark:{p:"#6366F1",s:"#8B5CF6"}};
  try{
    var k=localStorage.getItem("creator-cms-theme");
    var c=localStorage.getItem("creator-cms-custom-color");
    var p,s;
    if(k==="custom"&&c){p=c;}
    else if(k&&THEMES[k]){p=THEMES[k].p;s=THEMES[k].s;}
    if(p){
      var r=parseInt(p.slice(1,3),16),g=parseInt(p.slice(3,5),16),b=parseInt(p.slice(5,7),16);
      var el=document.documentElement;
      el.style.setProperty("--t-primary",p);
      el.style.setProperty("--t-primary-light","rgba("+r+","+g+","+b+",0.09)");
      el.style.setProperty("--t-primary-glow","rgba("+r+","+g+","+b+",0.28)");
      if(s){el.style.setProperty("--t-secondary",s);}
      el.setAttribute("data-theme",k||"custom");
    }
  }catch(e){}
})();
        ` }} />
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
        <ThemeProvider>
          <NextAuthSessionProvider>
            <ContentProvider>
              {children}
            </ContentProvider>
          </NextAuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
