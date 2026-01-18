import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import ContactForm from "@/components/ui/contact-form";
import { cn } from "@/lib/utils";
import { Upload, X, Search } from "lucide-react";


const exampleImages = [
  { value: "/static/test-1.png", label: "" },
  { value: "/static/test-2.png", label: "" },
  { value: "/static/test-4c.png", label: "" },
  { value: "/static/test-5.png", label: "" },
  { value: "/static/test-6.png", label: "" },
];

function Index() {
  const [analysis, setAnalysis] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<{ file: File; url: string; name: string } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [lastRenderTime, setLastRenderTime] = useState(0)
  const [selectedExampleImage, setSelectedExampleImage] = useState<string | null>(null)

  // Compteur de secondes quand isLoading est true
  useEffect(() => {
    let interval
    if (isLoading) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 0.1)
      }, 100)
    } else {
      if (seconds > 0) {
        setLastRenderTime(seconds)
      }
      setSeconds(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLoading, seconds])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const convertMarkdownToHtml = useCallback((text: string) => {
    if (!text) return ""
    try {
      return text
        .replace(/#### (.*?)(?=\n|$|####|###)/g, '<h3 class="mt-2 -mb-4">$1</h3>')
        .replace(/### (.*?)(?=\n|$|####|###)/g, '<h3 class="mt-2 -mb-4">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/(\d+\. \*\*.*?\*\* :)/g, '<h4>$1</h4>')
        .replace(/- \*\*(.*?)\*\* : (.*?)(?=\n-|\n\n|$)/g, '<li><strong>$1</strong> : $2</li>')
        .replace(/(<li>.*?<\/li>)/gs, '<ul class="list-disc list-inside mt-2">$1</ul>')
        .replace(/(https?:\/\/[^\s<>"']+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>')
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/\n/g, '<br/>')
    } catch (error) {
      console.error("Erreur lors de la conversion markdown:", error)
      return text
    }
  }, [])

  const defaultResponse = {
    bot_response: "### Analyse Mode Professionnelle\n\nL'image présente une tenue élégante et sophistiquée, idéale pour une clientèle recherchant des pièces de haute qualité et de style intemporel. Voici une description détaillée des éléments vestimentaires observés :\n\n1. **Manteau en Tweed Noir et Blanc** :\n   - **Couleurs** : Noir et blanc.\n   - **Motif** : Tweed avec un motif en losanges.\n   - **Matière** : Tweed, probablement en laine, offrant une texture riche et une chaleur confortable.\n   - **Description** : Ce manteau est une pièce maîtresse de la tenue, apportant une touche de sophistication et de classicisme. Le motif en losanges ajoute une dimension visuelle intéressante tout en restant sobre.\n\n2. **Combinaison en Laine Jersey** :\n   - **Couleurs** : Noir.\n   - **Matière** : Laine jersey, offrant une texture douce et confortable.\n   - **Description** : La combinaison est une pièce polyvalente qui peut être portée seule ou sous des couches supplémentaires. Elle épouse parfaitement la silhouette, offrant une allure élégante et moderne.\n\n3. **Gants en Cuir à Côtes** :\n   - **Couleurs** : Noir.\n   - **Matière** : Cuir.\n   - **Description** : Les gants en cuir ajoutent une touche de luxe et de praticité à la tenue. Leur design à côtes offre une texture supplémentaire et une meilleure adhérence.\n\n4. **Sac Mini à Rabat** :\n   - **Couleurs** : Noir.\n   - **Matière** : Cuir matelassé.\n   - **Description** : Ce sac est un accessoire emblématique, reconnaissable par son design matelassé et son rabat. Il ajoute une touche de luxe et de sophistication à l'ensemble de la tenue.\n\n5. **Ceinture à Chaîne** :\n   - **Couleurs** : Noir.\n   - **Matière** : Cuir et chaîne métallique.\n   - **Description** : La ceinture à chaîne est un accessoire tendance qui ajoute une touche de modernité et de sophistication à la tenue. Elle peut être portée pour cintrer la taille et ajouter une dimension supplémentaire à la silhouette.\n\n6. **Bottes en Cuir à Talons** :\n   - **Couleurs** : Noir.\n   - **Matière** : Cuir.\n   - **Description** : Les bottes en cuir à talons complètent parfaitement la tenue, offrant une allure élégante et sophistiquée. Leur design épuré et leur talon haut ajoutent une touche de féminité et de raffinement.\n\n### Articles Similaires\n\nIl est important de noter que les articles suivants sont similaires mais pas nécessairement identiques à ceux présentés sur l'image.\n\n- **Manteau en Tweed Noir et Blanc Chanel** (\\$9,600.00) : https://go.shopmy.us/p-12166868\n- **Gants en Cuir à Côtes Canada Goose** (\\$195.00) : https://go.shopmy.us/p-12252721\n- **Sac Mini à Rabat Chanel** (\\$5,000.00) : https://go.shopmy.us/p-12167440\n- **Combinaison en Laine Jersey Chanel** (\\$4,650.00) : https://go.shopmy.us/p-12166868\n- **Ceinture à Chaîne Chanel** (\\$2,250.00) : https://go.shopmy.us/p-12166880\n\nCes articles similaires offrent des options de haute qualité pour recréer ou s'inspirer de la tenue présentée, tout en permettant une personnalisation selon les préférences individuelles.",
    closest_image_url: 'https://64.media.tumblr.com/800a49287ede1fa2b0529d6ffbd363b6/c200f906907b3c8e-b6/s540x810/1ded8ff32cfbbb39b36c5bb03e2eebe9da95270e.pnj'
  }

  useEffect(() => {
    if (!analysis && !imageUrl) {
      setAnalysis(convertMarkdownToHtml(defaultResponse.bot_response))
      setImageUrl(defaultResponse.closest_image_url)
    }
  }, [analysis, imageUrl, convertMarkdownToHtml])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const file = files.find(file => file.type.startsWith('image/'))
    if (!file) return

    const url = URL.createObjectURL(file)
    const name = file.name

    setUploadedImage({ file, url, name })
  }, [])

  const handleImage = useCallback(async (image: string) => {
    setSelectedExampleImage(image)
    // Convertir l'image de test en File object
    const response = await fetch(image)
    const blob = await response.blob()

    // Créer un nom de fichier approprié
    const name = image.split('/').pop()?.split('.')[0] + '.png' || 'image.png'

    // Créer un File object avec le nom approprié
    const file = new File([blob], name, { type: 'image/png' })
    const url = URL.createObjectURL(file)

    setUploadedImage({ file, url, name })
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const file = files.find(file => file.type.startsWith('image/'))
    if (!file) return

    const url = URL.createObjectURL(file)
    const name = file.name

    setUploadedImage({ file, url, name })
  }, [])

  const removeImage = useCallback(() => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.url)
      setUploadedImage(null)
    }
  }, [uploadedImage])

  const analyzeImage = useCallback(async (image: { file: File; url: string; name: string }) => {
    setIsLoading(true)
    setAnalysis("")
    setImageUrl("")
    try {
      const formData = new FormData()

      const imageFile = image.file
      formData.append('image', imageFile)

      const response = await fetch('/analyze', {
        method: 'POST',
        body: formData
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        const apiError = data.Erreur || data.error || "Erreur lors de l'analyse"
        throw new Error(apiError)
      }
      if (!data?.message?.bot_response) {
        throw new Error("Réponse invalide du serveur")
      }

      setAnalysis(convertMarkdownToHtml(data.message.bot_response))
      setImageUrl(data.message.closest_image_url || "")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setAnalysis(`Erreur: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [convertMarkdownToHtml])

  return (
    <main className="mx-auto max-w-5xl w-full pb-24 px-2">
      <CardHeader className="relative z-20">
        <CardTitle
          variant="h1"
          className="text-center mx-auto max-w-xl flex items-center justify-center gap-3"
        >
          <div
            style={{ fontFamily: "'Gabarito', sans-serif" }}
            className="font-extrabold flex flex-col bg-gradient-to-br from-[#f5f5f5] via-slate-00 to-gray-200 text-black rounded-xl w-11 h-11 flex items-center justify-center text-sm"
          >
            Style
          </div>
          <span style={{ fontFamily: "'Gabarito', sans-serif" }}>
            StyleAnalyzer
          </span>
        </CardTitle>
        <CardDescription className="text-center text-2xl font-bold text-black max-w-xl mx-auto leading-7">
          Analysez le style de vos vètements et trouvez-en des similaires à ceux
          que porte Taylor Swift
        </CardDescription>
        <CardDescription className="text-center text-sm">
          <strong>RAG Multimodal</strong> scannant 190 tenues de Taylor Swift
          comme données
        </CardDescription>
        <img
          src="/static/mistral.png"
          alt=""
          className="object-contain mx-auto flex justify-center mx-auto border border-gray-100 rounded-xl w-10 h-10 p-1 shadow-lg"
        />
      </CardHeader>

      <Card className="border-none mx-auto shadow-none">
        <CardContent className="p-0 border-none">
          <CardTitle variant="h4">
            Testez avec une tenue ou uplodez-en une
          </CardTitle>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-2">
            {exampleImages.map((img) => (
              <div
                key={img.value}
                className={cn(
                  "relative h-60 cursor-pointer rounded-md overflow-hidden transition-all hover:opacity-80",
                  selectedExampleImage === img.value
                    ? "border-primary ring-2 ring-primary"
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => handleImage(img.value)}
              >
                <img
                  src={img.value}
                  alt={img.label}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            <div
              className={cn(
                "relative w-full flex-1 bg-gray-100 border-2 border-dashed rounded-sm text-center flex flex-col",
                "border-upload-border hover:border-primary",
                uploadedImage ? "p-1" : "p-4 items-center justify-center"
              )}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {uploadedImage ? (
                <>
                  <img
                    src={uploadedImage.url}
                    alt={uploadedImage.name}
                    className="object-cover max-h-[230px] rounded-sm"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 z-10 w-6 h-6"
                    onClick={removeImage}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Uploadez une image
                  </p>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/png,image/jpg,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="leading-4 py-4"
                    onClick={() =>
                      document.getElementById("file-input")?.click()
                    }
                  >
                    Charger une image
                  </Button>
                </>
              )}
            </div>
          </div>
          <Button
            onClick={() => uploadedImage && analyzeImage(uploadedImage)}
            className="w-max-xl w-full mx-auto"
            size="xl"
            disabled={isLoading || !uploadedImage}
          >
            <Search className="h-4 w-4" />
            Analyser
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-5xl mx-auto shadow-none mt-4">
        <CardContent className="px-8 py-6 rounded-xl overflow-hidden">
          {imageUrl && (
            <img
              src={imageUrl}
              className="float-right p-4 w-[440px] h-[440px] ml-4 mb-4 mt-24 object-cover"
            />
          )}

          {imageUrl && (
            <CardTitle variant="h4" className="-mb-2">
              Tenue trouvée la plus proche :
            </CardTitle>
          )}

          {isLoading && (
            <div className="flex items-center">
              <span>Analyse en cours... {seconds.toFixed(1)}s</span>
            </div>
          )}

          {!isLoading && lastRenderTime > 0 && (
            <div className="flex items-center">
              <span>Analyse terminée en {lastRenderTime.toFixed(1)}s</span>
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: analysis }} />
        </CardContent>
      </Card>

      <Card
        id="contact-form"
        className="mt-12 border-none max-w-2xl mx-auto shadow-none"
      >
        <CardContent className="p-0 border-none">
          <CardTitle
            variant="h2"
            className="bg-gradient-to-br from-black via-black to-black bg-clip-text text-transparent"
          >
            Étude de cas
          </CardTitle>
          <CardTitle variant="h3-card" className="mb-0 mt-4">
            Le challenge
          </CardTitle>
          <CardTitle variant="h3" className="font-medium">
            Avoir un système de recommandation MM-RAG de tenues au style
            similaires à l'image uploadée (sans entraînements de modèl
            donc)
          </CardTitle>
          <ul className="list-disc list-inside mb-4 space-y-4">
            <li>
              <strong>
                Pouvoir mettre à jour facilement le jeu de données
              </strong>
              , et ainsi éviter de lancer des entraînements continuels d'un modèle.
            </li>
            <li>
              <strong>
                Avoir un modèle de vision spécifique pour le RAG</strong>, précis pour recommander des tenues
            </li>
            <li>
              <strong>Avoir un 2ème modèle vision spécifique à l'analyse stylistique</strong>
              , suffisament capable, exemple les modèles Pixtral de Mistral AI.
            </li>
          </ul>
          <CardTitle variant="h3-card">Résultats et évaluation</CardTitle>
          <ul className="list-inside mb-4 space-y-4">
            <li>
              <strong>
                ⚡ Pas besoin de reranker <span>100% de précision atteinte dans la
                reconnaissance des vètements</span>
              </strong>
                {" "} du jeu de données (les tenues de Taylor Swift) grâce au modèle ConvNeXt-Tiny (2022). Les modèles plus anciens en étaients incapables.
            </li>
            <li>
              <strong>
                  Analyse stylistique poussé et <span>reconnaissances des matières</span>
                , des formes des tenues
              </strong>{" "}
              grâce au modèle Pixtral Large de Mistral AI.
            </li>
            <li>
              <strong>
                🔄 Mise à jour facile des données{" "}
                <span>car pas d'entraînement requis</span></strong> ce qui est un
                avatange non négligeable.
              Il suffit d'ajouter des tenues dans le jeu de données.
            </li>
            <li>
              <strong>
                📊 <span>la latence est un peu longue c'est un point faible</span>.</strong> D'où la nécéssité d'avoir un GPU NVidia minimal sur l'hébergement final en prod de l'application.
              <img
                src="/static/langsmith.png"
                alt="LangSmith"
                className="w-full h-auto rounded mt-3 border border-gray-100 rounded-sm"
              />
              <CardDescription className="italic text-center text-xs">
                Montoring dans LangSmith
              </CardDescription>
            </li>
          </ul>
          <CardTitle
            variant="h3"
            className="mt-12 max-w-xl mx-auto text-center"
          >
            On discute de votre projet d'automatisation ou d'application?
          </CardTitle>
          <CardDescription className="text-center mb-4">
            Remplissez le formulaire ci-dessous et je vous recontacte dans les
            24-48 heures.
          </CardDescription>
          <ContactForm />
        </CardContent>
      </Card>
    </main>
  );
}

export default Index;