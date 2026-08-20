import "./globals.css";
import Providers from "./Providers";

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
        {/* Blocking script: applies the stored 3-role theme (text/component/
            page) + mode before first paint — mirrors lib/themes.js
            buildThemeVars()/deriveTextTokens/deriveComponentTokens/
            deriveSurfaceTokens exactly, so there's no flash of the default
            theme on reload. Necessarily a plain-JS duplicate (runs before
            any bundle is parsed). */}
        <script dangerouslySetInnerHTML={{
          __html: `
(function(){
  var PRESETS={
    indigo:{c:{text:"#312E81",component:"#6366F1",page:"#EEF2FF"},m:"light"},
    ocean:{c:{text:"#164E63",component:"#0891B2",page:"#ECFEFF"},m:"light"},
    emerald:{c:{text:"#064E3B",component:"#10B981",page:"#ECFDF5"},m:"light"},
    rose:{c:{text:"#881337",component:"#F43F5E",page:"#FFF1F2"},m:"light"},
    amber:{c:{text:"#78350F",component:"#F59E0B",page:"#FFFBEB"},m:"light"},
    dark:{c:{text:"#E0E7FF",component:"#818CF8",page:"#0B0B14"},m:"dark"}
  };
  function hex2rgb(h){return {r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)};}
  function lum(h){var c=hex2rgb(h);function f(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);}
  function fg(h){var wc=(1.05)/(lum(h)+0.05),bc=(lum(h)+0.05)/0.05;return wc>=bc?"#FFFFFF":"#0A0A0F";}
  function contrast(a,b){var l1=lum(a)+0.05,l2=lum(b)+0.05;return l1>l2?l1/l2:l2/l1;}
  function rgba(h,a){var c=hex2rgb(h);return "rgba("+c.r+","+c.g+","+c.b+","+a+")";}
  function mixHex(hexA,hexB,pct){var a=hex2rgb(hexA),b=hex2rgb(hexB),t=pct/100;function c(v){return Math.round(Math.min(255,Math.max(0,v))).toString(16).padStart(2,"0");}return "#"+c(a.r*t+b.r*(1-t))+c(a.g*t+b.g*(1-t))+c(a.b*t+b.b*(1-t));}
  function hex2hsl(hex){var c=hex2rgb(hex),r=c.r/255,g=c.g/255,b=c.b/255,max=Math.max(r,g,b),min=Math.min(r,g,b),h=0,s=0,l=(max+min)/2;if(max!==min){var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}}return [h*360,s*100,l*100];}
  function hsl2hex(h,s,l){s/=100;l/=100;var a=s*Math.min(l,1-l);function f(n){var k=(n+h/30)%12;var col=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*col).toString(16).padStart(2,"0");}return "#"+f(0)+f(8)+f(4);}
  function shift(hex,delta){var hsl=hex2hsl(hex);return hsl2hex(hsl[0],hsl[1],Math.min(100,Math.max(0,hsl[2]+delta)));}

  function deriveSurfaces(pageHex,mode){
    if(mode==="dark"){
      return {page:pageHex,pageSoft:mixHex("#000000",pageHex,18),surface:mixHex("#FFFFFF",pageHex,6),
        surfaceHover:mixHex("#FFFFFF",pageHex,10),surfaceSelected:mixHex("#FFFFFF",pageHex,14),
        header:mixHex("#FFFFFF",pageHex,4),sidebar:mixHex("#000000",pageHex,55)};
    }
    return {page:pageHex,pageSoft:mixHex("#000000",pageHex,4),surface:mixHex("#FFFFFF",pageHex,88),
      surfaceHover:mixHex("#FFFFFF",pageHex,78),surfaceSelected:mixHex("#FFFFFF",pageHex,70),
      header:mixHex("#FFFFFF",pageHex,92),sidebar:mixHex("#000000",pageHex,88)};
  }
  function deriveText(textHex,mode,surfaceHex){
    var main=textHex,guard=0;
    var towardDark=lum(surfaceHex)>0.5;
    while(contrast(main,surfaceHex)<4.5 && guard<12){ main=shift(main,towardDark?-6:6); guard++; }
    return {main:main,secondary:mixHex(main,surfaceHex,mode==="dark"?82:78),muted:mixHex(main,surfaceHex,mode==="dark"?68:62),subtle:mixHex(main,surfaceHex,mode==="dark"?45:40),disabled:mixHex(main,surfaceHex,mode==="dark"?30:26)};
  }
  function deriveComponent(hex,mode){
    var hd=mode==="dark"?8:-8;
    return {base:hex,hover:shift(hex,hd),active:shift(hex,hd*1.6),
      soft:rgba(hex,mode==="dark"?0.18:0.10),softHover:rgba(hex,mode==="dark"?0.26:0.16),
      border:rgba(hex,mode==="dark"?0.35:0.22),focus:rgba(hex,0.32),foreground:fg(hex)};
  }

  try{
    var k=localStorage.getItem("creator-cms-theme");
    var mode=localStorage.getItem("creator-cms-mode")||"light";
    var colors=null;
    if(k==="custom"){
      var stored=localStorage.getItem("creator-cms-custom-colors");
      if(stored){ try{ colors=JSON.parse(stored); }catch(e){} }
    } else if(k && PRESETS[k]){
      colors=PRESETS[k].c;
      mode=PRESETS[k].m;
    }
    if(colors && colors.text && colors.component && colors.page){
      var el=document.documentElement;
      var surf=deriveSurfaces(colors.page,mode);
      var text=deriveText(colors.text,mode,surf.surface);
      var comp=deriveComponent(colors.component,mode);
      var sidebarTextMain=mixHex("#FFFFFF",colors.text,55);
      var sidebarTextDim=mixHex(sidebarTextMain,surf.sidebar,55);

      el.style.setProperty("--theme-text",text.main);
      el.style.setProperty("--theme-text-secondary",text.secondary);
      el.style.setProperty("--theme-text-muted",text.muted);
      el.style.setProperty("--theme-text-subtle",text.subtle);
      el.style.setProperty("--theme-text-disabled",text.disabled);
      el.style.setProperty("--theme-text-link",text.main);

      el.style.setProperty("--theme-component",comp.base);
      el.style.setProperty("--theme-component-hover",comp.hover);
      el.style.setProperty("--theme-component-active",comp.active);
      el.style.setProperty("--theme-component-soft",comp.soft);
      el.style.setProperty("--theme-component-soft-hover",comp.softHover);
      el.style.setProperty("--theme-component-border",comp.border);
      el.style.setProperty("--theme-component-focus",comp.focus);
      el.style.setProperty("--theme-component-foreground",comp.foreground);

      el.style.setProperty("--theme-page",surf.page);
      el.style.setProperty("--theme-page-soft",surf.pageSoft);
      el.style.setProperty("--theme-surface",surf.surface);
      el.style.setProperty("--theme-surface-hover",surf.surfaceHover);
      el.style.setProperty("--theme-surface-selected",surf.surfaceSelected);

      // Legacy --t-* aliases
      el.style.setProperty("--t-primary",comp.base);
      el.style.setProperty("--t-primary-hover",comp.hover);
      el.style.setProperty("--t-primary-active",comp.active);
      el.style.setProperty("--t-primary-soft",comp.soft);
      el.style.setProperty("--t-primary-soft-hover",comp.softHover);
      el.style.setProperty("--t-primary-glow",comp.focus);
      el.style.setProperty("--t-primary-foreground",comp.foreground);
      el.style.setProperty("--t-primary-dark",comp.hover);
      el.style.setProperty("--t-primary-light",comp.soft);
      el.style.setProperty("--t-secondary",comp.hover);
      el.style.setProperty("--t-secondary-hover",comp.active);
      el.style.setProperty("--t-secondary-soft",comp.softHover);
      el.style.setProperty("--t-secondary-foreground",comp.foreground);
      el.style.setProperty("--t-accent",comp.base);
      el.style.setProperty("--t-accent-hover",comp.hover);
      el.style.setProperty("--t-accent-soft",comp.soft);
      el.style.setProperty("--t-accent-foreground",comp.foreground);
      el.style.setProperty("--t-bg",surf.page);
      el.style.setProperty("--t-surface",surf.surface);
      el.style.setProperty("--t-surface-muted",surf.pageSoft);
      el.style.setProperty("--t-header-bg",surf.header);
      el.style.setProperty("--t-text",text.main);
      el.style.setProperty("--t-text-2",text.muted);
      el.style.setProperty("--t-text-3",text.subtle);
      el.style.setProperty("--t-border",comp.border);
      el.style.setProperty("--t-border-hover",rgba(colors.component,mode==="dark"?0.45:0.32));
      el.style.setProperty("--t-focus-ring",comp.focus);
      el.style.setProperty("--t-sidebar",surf.sidebar);
      el.style.setProperty("--t-sidebar-text",sidebarTextMain);
      el.style.setProperty("--t-sidebar-text-dim",sidebarTextDim);
      el.style.setProperty("--t-chart-1",comp.base);
      el.style.setProperty("--t-chart-2",text.main);
      el.style.setProperty("--t-chart-3",comp.hover);
      el.style.setProperty("--t-chart-4",mixHex(comp.base,text.main,50));
      el.style.setProperty("--t-chart-5",comp.active);

      el.setAttribute("data-theme",k||"custom");
      el.setAttribute("data-mode",mode);
    }
  }catch(e){}
})();
        ` }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
