import Index from "@/index";
import { Button } from "@/components/ui/button.tsx";
import { ArrowRight } from "lucide-react";
import { CardTitle, CardDescription } from "@/components/ui/card.tsx";

const App = () => {
  return (
    <>
      <header className="flex justify-end items-center h-14 px-2 w-full border-b border-gray-200">
        <div className="mx-auto max-w-5xl w-full flex justify-between items-center">
          <a
            href="https://github.com/julienlucas/fashionstyle-clothes-recognition-mm-rag"
            target="_blank"
            className="no-underline"
          >
            <Button size="default">Repo Github</Button>
          </a>
          <p className="text-sm flex items-center gap-1">
            Consultez mes autres projets IA
            <ArrowRight className="h-4 w-4" />
          </p>
        </div>
      </header>
      <Index />
      <footer className="max-w-2xl w-full mx-auto border-t border-zinc-200 mt-auto">
        <CardTitle variant="h4">Mes autres projets IA</CardTitle>
        <CardDescription className="text-sm flex items-center gap-1">
          Fakefinder Nano Banana Pro
        </CardDescription>
        <CardDescription className="text-sm flex items-center gap-1">
          DocChat RAG Agentique pour docs techniques
        </CardDescription>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-sm flex justify-center">
            © {new Date().getFullYear()} Julien Lucas. Tous droits réservés.
          </div>
        </div>
      </footer>
    </>
  );
};

export default App;
