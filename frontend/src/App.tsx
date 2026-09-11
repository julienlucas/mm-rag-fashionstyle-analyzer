import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ContactWidget } from "@/components/site/ContactWidget";
import { Hero } from "@/components/sections/Hero";
import { Journey } from "@/components/sections/Journey";
import { Results } from "@/components/sections/Results";
import { Architecture } from "@/components/sections/Architecture";
import { Contact } from "@/components/sections/Contact";

export default function App() {
  return (
    <TooltipProvider delayDuration={150}>
      <main>
        <Hero />
        <Journey />
        <Results />
        <Architecture />
        <Contact />
      </main>
      <ContactWidget />
      <Toaster />
    </TooltipProvider>
  );
}
