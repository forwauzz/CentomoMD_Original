import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, Sparkles, X, Upload } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from '@/components/case/RichTextEditor';

interface Section07Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
  caseId: string;
}

interface Citation {
  id: string;
  paragraph: string;
  page: number;
  source: string;
}

interface SummaryWithCitations {
  summary: string;
  citations: Citation[];
}

export const Section07: React.FC<Section07Props> = ({ data, onUpdate, onSave, caseId }) => {
  const addToast = useUIStore(state => state.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSplitView, setShowSplitView] = useState(false);
  const [summary, setSummary] = useState(data.summary || '');
  const [uploadedDocumentUrl, setUploadedDocumentUrl] = useState<string | null>(
    data.documentUrl || null
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(
    data.documentFileName || null
  );
  const [summaryWithCitations, setSummaryWithCitations] = useState<SummaryWithCitations | null>(
    data.summaryWithCitations || null
  );

  // Restore document URL from saved data on mount
  useEffect(() => {
    if (data.documentBase64 && !uploadedDocumentUrl) {
      try {
        // Convert base64 to blob and create object URL
        const base64Data = data.documentBase64;
        const byteString = atob(base64Data.split(',')[1]);
        const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const url = URL.createObjectURL(blob);
        setUploadedDocumentUrl(url);
      } catch (error) {
        console.error('Error restoring document URL:', error);
      }
    }
    if (data.documentFileName && !uploadedFileName) {
      setUploadedFileName(data.documentFileName);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type)) {
      addToast({
        type: 'error',
        title: 'Type de fichier invalide',
        message: 'Veuillez téléverser un fichier PDF ou DOCX.'
      });
      return;
    }

    try {
      // Create object URL for viewing
      const objectUrl = URL.createObjectURL(file);
      setUploadedDocumentUrl(objectUrl);
      setUploadedFileName(file.name);
      
      // Save to localStorage for persistence
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onUpdate({ 
          documentUrl: objectUrl,
          documentFileName: file.name,
          documentBase64: base64,
          documentType: file.type
        });
        onSave();
      };
      reader.readAsDataURL(file);

      addToast({
        type: 'success',
        title: 'Document téléversé',
        message: `Le document "${file.name}" a été téléversé avec succès.`
      });

      // Auto-open split view if not already open
      if (!showSplitView) {
        setShowSplitView(true);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de téléverser le document.'
      });
    }
  };

  const handleReviewDocs = () => {
    if (!uploadedDocumentUrl) {
      // If no document uploaded, prompt to upload
      fileInputRef.current?.click();
      return;
    }
    setShowSplitView(true);
    addToast({
      type: 'info',
      title: 'Documents ouverts',
      message: 'Vous pouvez maintenant générer le résumé avec citations.'
    });
  };

  const handleGenerateSummary = async () => {
    if (!showSplitView || !uploadedDocumentUrl) {
      addToast({
        type: 'warning',
        title: 'Ouvrir les documents d\'abord',
        message: 'Veuillez téléverser et ouvrir un document avant de générer le résumé.'
      });
      return;
    }

    try {
      addToast({
        type: 'info',
        title: 'Génération en cours',
        message: 'Création du résumé avec citations à partir du document...'
      });

      // In production, this would parse the PDF/DOCX and extract content
      // Using the default Section 7 summary text
      const defaultSummary = `La fiche de réclamation du travailleur décrit l'événement suivant survenu le 3 mars 2021 :

« Je nettoyais les tuiles au plafond. Quand je suis descendu de l'échelle, j'ai mis le pied dans un trou qui était dans le sol. Ma cheville droit a fait une torsion et je suis tombé. Au moment de la chute j'ai tenté de retenir avec ma main et je me suis fait mal au 3e doigt de la main droite. Au moment de la chute ça a fait mal, mais je croyais que sa passerait, cependant dans la nuit du 3 mars au 4 mars la DLR est venue de façon vive et intense, m'empêchant de dormir. Au matin, présence d'œdème à la cheville qui accompagnait la DLR. »

Le travailleur rencontre le docteur Mélinka Blais-Rétamal, le 4 mars 2021. Elle diagnostique une entorse à la cheville droite et une entorse du 3e doigt de la main droite. Elle prescrit des radiographies, suggère d'éviter la mise en charge, prescrit un arrêt de travail et de l'analgésie.

Le travailleur obtient des radiographies du pied et de la cheville droits, le 4 mars 2021. Elles sont interprétées par le docteur Anna Barbara Sinsky, radiologiste. Cette dernière constate :

« Pied et cheville droits

Il n'y a pas d'épanchement intra-articulaire à la cheville. Œdème des tissus mous autour de la malléole externe. La mortaise est bien préservée. Il n'y a pas d'anomalie démontrée au niveau du pied. »

Le travailleur rencontre le docteur André Ménard, le 12 mars 2021. Il diagnostique une entorse de la cheville droite et une entorse du 3e doigt de la main droite. Il juge la condition clinique stable. Il note une amélioration au niveau du doigt. Il suggère un retour au travail dans une semaine et prescrit de la physiothérapie.

Le travailleur revoit le docteur Ménard, le 28 mars 2021. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et prescrit un arrêt de travail après un échec de retour au travail.

Le travailleur revoit le docteur Ménard, le 21 avril 2021. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie, l'arrêt de travail et prescrit une botte de marche.

Le travailleur revoit le docteur Ménard, le 19 mai 2021. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail.

Le travailleur revoit le docteur Ménard, le 23 juin 2021. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie et l'arrêt de travail. Il prescrit une échographie de surface au niveau des tendons fibulaires et une résonance magnétique de la cheville droite afin d'éliminer une atteinte tarsienne.

Le travailleur revoit le docteur Ménard, le 30 juillet 2021. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie, l'arrêt de travail et ajoute des traitements en ergothérapie.

Le travailleur obtient une résonance magnétique de la cheville droite, le 30 juillet 2021. Elle est interprétée par le docteur Laurent Bilodeau, radiologiste. Ce dernier constate :

«…

Conclusion :

Signes d'ancienne entorse des ligaments tibiopéronier antérieurs, talopéronier antérieur, calcanéopéronier et des fibres profondes du ligament deltoïde.

Pas d'atteinte des tendons péroniers.

Doute sur une légère ténosynovite des tendons tibial postérieur, long fléchisseur des orteils et long fléchisseur de l'hallux, de signification clinique incertaine. »

Le travailleur revoit le docteur Ménard, le 25 août 2021. Il juge la condition clinique stable. Il constate les résultats de la résonance magnétique, maintient les traitements en physiothérapie, ergothérapie et l'arrêt de travail.

Le travailleur revoit le docteur Ménard, le 24 septembre 2021. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie, ergothérapie et l'arrêt de travail.

Le travailleur revoit le docteur Ménard, le 25 octobre et le 24 novembre 2021, aucun changement sur la prise en charge et la conduite à tenir.

Le travailleur revoit le docteur Ménard, le 19 janvier 2022. Il juge la condition clinique stable. Il suspecte un syndrome douleur régional complexe. Il prescrit un EMG des membres inférieurs. Il maintient les traitements en physiothérapie, ergothérapie et l'arrêt de travail.

Le travailleur revoit le docteur Ménard, le 14 mars 2022. Il juge la condition clinique stable. Il maintient l'arrêt de travail. Le docteur Ménard note : « a eu des moments difficiles et était en désintox depuis 6 semaines, troubles anxiodépressifs secondaires se sont développé » Le docteur Ménard demande de réinitialiser les traitements physiothérapie et ergothérapie.

Le travailleur revoit le docteur Ménard, le 2 mai 2022. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie, ergothérapie et l'arrêt de travail. Le travailleur rapporte des douleurs de type lombosciatalgies.

Le travailleur rencontre le docteur Blouin, chirurgien orthopédiste, le 18 mai 2022. Le docteur Blouin rapporte aucun signe d'instabilité au niveau de la cheville droite et recommande un traitement conservateur. Il note une lombosciatalgie droite et prescrit un scan du rachis lombaire. Il désire revoir le travailleur après les investigations.

Le travailleur revoit le docteur Ménard, le 13 juin 2022. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie, ergothérapie et l'arrêt de travail. Il note que le travailleur a rencontré le docteur Blouin, il y a trois semaines, qu'il a prescrit une IRM lombaire. Il rapporte une récente chute avec perte d'équilibre et impact sur sa main droite. Le docteur Ménard demande une radiographie afin d'éliminer une fracture.

Le travailleur obtient une radiographie du poignet droit, le 13 juin 2022. Elle est interprétée par le docteur Pierre Lacaille-Bélanger, radiologiste. Ce dernier constate :

« Il n'y a pas de signe de fracture. Subtil écartement radiocubital distal. La douleur est-elle à ce site ? Il pourrait s'agir d'un « DRUJ ». »

Le travailleur revoit le docteur Ménard, le 1er août 2022. Il note qu'étant donné la lésion à la cheville droite, le travailleur accuse des troubles d'équilibre et a chuté à plusieurs reprises. Il note une radiographie du poignet droit sans fracture mais ajoute un diagnostic d'entorse au poignet droit. Il maintient les traitements en physiothérapie, ergothérapie et l'arrêt de travail.

Le travailleur est convoqué en expertise médicale en chirurgie orthopédique, le 31 août 2022. Cette expertise est réalisée par le docteur Guy Le Bouthillier, chirurgien orthopédiste. Pour le diagnostic d'entorse à la cheville droite, le docteur Le Bouthillier juge qu'il est trop tôt pour consolider cette lésion. Pour ce qui est de l'entorse du 3e doigt de la main droite, le docteur Le Bouthillier consolide la lésion, le 31 août 2022. Il attribue aucune séquelle et aucune limitation fonctionnelle. Pour la lésion à la cheville droite, il suggère une orthèse et une infiltration de cortisone au niveau de la cheville droite. De plus, il suggère une investigation neurologique soit par résonance magnétique de la colonne lombo-sacrée ainsi qu'un EMG des membres inférieurs. Il suggère aussi une résonance magnétique de la hanche droite afin d'évaluer le nerf sciatique au niveau des courts rotateurs externes de la hanche droite. Il note qu'à l'examen physique, le travailleur semble probablement avoir un syndrome du piriformis à la hanche droite.

Le travailleur revoit le docteur Ménard, le 14 septembre 2022. Il juge la condition clinique stable. Il maintient les traitements en physiothérapie, ergothérapie et l'arrêt de travail. Le docteur Ménard rapporte être en attente du rapport d'expertise.

Le travailleur revoit le docteur Ménard, le 17 octobre 2022. Il juge la condition clinique stable. Il rapporte les trouvailles du scan du rachis lombaire avec des sténoses foraminales sans atteinte ou signe radiculaire mais présence d'arthrose importante en bilatérale. Il note que le travailleur devrait revoir l'orthopédiste, le docteur Blouin dans les prochaines semaines.

Le travailleur revoit le docteur Ménard, le 12 décembre 2022. Il note des aggravations au niveau des symptômes de la cheville droite à la suite d'un feu à son domicile.

Le travailleur revoit le docteur Ménard, le 30 janvier 2023 aucun changement sur la prise en charge de la conduite à tenir.

Le travailleur obtient un EMG des membres inférieurs, le 1er mars 2023. L'examen est réalisé par le docteur Valérie Dahan, physiatre. Cette dernière constate :

«…

Impression :

L'étude électrophysiologique met en évidence des signes de radiculopathie motrice chronique L5 droite. Il n'y avait pas de dénervation active. Les racines L3, L4 et S1 droites semblent intactes, et cliniquement, je n'ai pas de méralgie paresthetica droite, ne suit pas le territoire. »

Le travailleur revoit le docteur Ménard, le 7 mars 2023. Il diagnostique une entorse de la cheville droite et une atteinte tendineuse au niveau des muscles péroniers. Il juge la condition clinique stable. Il demande que le travailleur revoie le docteur Blouin afin de statuer s'il y a des traitements complémentaires avant de finaliser le dossier.

Le docteur Ménard produit un rapport complémentaire écrit, le 7 mars 2023. Il est en accord avec l'expertise du docteur Le Bouthillier. Il note qu'il a prescrit un EMG des membres inférieurs. Il croit qu'il n'y aura pas beaucoup d'amélioration à venir et que le travailleur restera avec un handicap significatif.

Le travailleur revoit le docteur Ménard, le 19 juin 2023. Le docteur Ménard note que le travailleur n'a jamais obtenu son infiltration cortisonée à sa cheville droite prévue en mars 2023. Il note qu'avant de consolider le travailleur, il aimerait que celui-ci obtienne son infiltration.

Le travailleur revoit le docteur Ménard, le 27 décembre 2023. Il rapporte un accident le 20 mai 2023 à la suite d'une chute, le travailleur s'est fracturé le tibia et le péroné gauche. Il a bénéficié d'une réduction ouverte et fixation interne, mais il a rechuté et a débricolé son matériel d'ostéosynthèse. Il a subi une 2e intervention et celle-ci s'est compliquée par une ostéomyélite. Le travailleur a par la suite bénéficié d'un retrait du matériel et mise en place d'un fixateur externe jusqu'à la guérison de l'infection.

Le travailleur revoit le docteur Ménard, le 27 février 2024. Il maintient le diagnostic d'entorse de cheville droite et atteinte tendineuse des muscles péroniers de la cheville droite. Il note une aggravation avec une fracture de la jambe gauche à la suite d'un déséquilibre, nombreuses complications post-opératoires avec ostéomyélite. Le docteur Ménard note que le travailleur ne s'est pas présenté à son rendez-vous pour une infiltration à la cheville droite et qu'il fait une nouvelle et dernière demande.

Le travailleur revoit le docteur Ménard, le 26 mars 2024. Il juge la condition clinique stable. Il rapporte une infiltration cortisonée à la cheville droite prévue le 5 avril 2024. Le travailleur est principalement indisposé fonctionnellement par sa lésion à sa jambe gauche.

Le travailleur revoit le docteur Ménard, le 7 mai 2024. Il juge la condition clinique stable. Il note une infiltration à la cheville droite partiellement efficace. Il est en attente pour une 2ième infiltration prévue dans 1 à 2 mois. Le docteur Ménard demande une IRM de contrôle au niveau de la cheville droite.`;

      const mockSummaryWithCitations: SummaryWithCitations = {
        summary: defaultSummary,
        citations: [
          {
            id: '1',
            paragraph: 'Le patient rapporte une douleur lombaire lors du déplacement d\'un lit d\'hôpital lourd le 19 avril 2024.',
            page: 1,
            source: uploadedFileName || 'Document téléversé'
          },
          {
            id: '2',
            paragraph: 'Augmentation des douleurs au fil de la journée, prise d\'Advil pour soulagement.',
            page: 1,
            source: uploadedFileName || 'Document téléversé'
          },
          {
            id: '3',
            paragraph: 'Le lendemain, travail supervisé avec limitations fonctionnelles concernant le soulèvement de charges.',
            page: 2,
            source: uploadedFileName || 'Document téléversé'
          },
          {
            id: '4',
            paragraph: 'Limitations fonctionnelles identifiées: soulèvement et pousser des charges lourdes, rester debout longtemps.',
            page: 2,
            source: uploadedFileName || 'Document téléversé'
          }
        ]
      };

      setSummaryWithCitations(mockSummaryWithCitations);
      setSummary(mockSummaryWithCitations.summary);
      onUpdate({ 
        summary: mockSummaryWithCitations.summary,
        summaryWithCitations: mockSummaryWithCitations,
        generatedAt: new Date().toISOString() 
      });
      onSave();

      addToast({
        type: 'success',
        title: 'Résumé généré',
        message: 'Le résumé avec citations a été généré avec succès.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de générer le résumé.'
      });
    }
  };

  const handleCloseSplitView = () => {
    setShowSplitView(false);
  };

  const getDocumentViewerUrl = () => {
    if (!uploadedDocumentUrl) return null;
    
    // For PDFs, use the object URL directly - browsers can display PDFs in iframe
    if (data.documentType === 'application/pdf' || uploadedFileName?.toLowerCase().endsWith('.pdf')) {
      return uploadedDocumentUrl;
    }
    
    // For DOCX files, browsers cannot display them directly
    // We'll show a message instead
    return null;
  };

  const isPdfDocument = () => {
    return data.documentType === 'application/pdf' || uploadedFileName?.toLowerCase().endsWith('.pdf');
  };

  if (showSplitView) {
    return (
      <div className="h-full flex flex-col min-h-0 bg-gray-50">
        {/* Header with actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <CardTitle className="text-xl">Section 7: Historique de faits et évolution</CardTitle>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              <span>Téléverser un document</span>
            </Button>
            <Button
              onClick={handleGenerateSummary}
              className="flex items-center gap-2 bg-[#009639] hover:bg-[#007a2e] text-white"
            >
              <Sparkles className="h-4 w-4" />
              <span>Générer le résumé</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleCloseSplitView}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              <span>Fermer</span>
            </Button>
          </div>
        </div>

        {/* Split View */}
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0 p-6">
          {/* Left: Document Viewer */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Document</span>
                  {uploadedFileName && (
                    <span className="text-xs text-gray-500 ml-2">({uploadedFileName})</span>
                  )}
                </div>
                {!uploadedDocumentUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    <span className="text-xs">Téléverser</span>
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
              {uploadedDocumentUrl ? (
                isPdfDocument() ? (
                  <div className="w-full h-full">
                    <iframe
                      src={`${uploadedDocumentUrl}#toolbar=0`}
                      className="w-full h-full border-0"
                      title="Document Viewer"
                      style={{ minHeight: '500px', width: '100%', height: '100%' }}
                      allow="fullscreen"
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Document DOCX téléversé</p>
                      <p className="text-sm text-gray-500 mb-4">
                        {uploadedFileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Les fichiers DOCX ne peuvent pas être prévisualisés directement dans le navigateur.
                        <br />
                        Veuillez utiliser "Générer le résumé" pour extraire le contenu.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Aucun document téléversé</p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Téléverser un document</span>
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Formats supportés: PDF (prévisualisation), DOCX
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Summary with Citations */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Résumé avec citations
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
              <ScrollArea className="h-full w-full">
                <div className="p-4">
                  {summaryWithCitations ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Résumé généré
                        </label>
                        <div className="mb-4">
                          <RichTextEditor
                            value={summary}
                            onChange={(newValue) => {
                              setSummary(newValue);
                              onUpdate({ 
                                ...data,
                                summary: newValue 
                              });
                            }}
                            placeholder="Le résumé généré apparaîtra ici..."
                            className="h-[400px]"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Citations et sources
                        </h4>
                        <div className="space-y-3">
                          {summaryWithCitations.citations.map((citation, index) => (
                            <div
                              key={citation.id}
                              className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-xs font-medium text-blue-700">
                                  Citation {index + 1}
                                </span>
                                <span className="text-xs text-gray-500">
                                  Page {citation.page} • {citation.source}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 italic">
                                "{citation.paragraph}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {data.generatedAt && (
                        <p className="text-xs text-gray-500 mt-4">
                          Généré le {new Date(data.generatedAt).toLocaleString('fr-CA')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-sm">
                        Cliquez sur "Générer le résumé" pour créer un résumé avec citations à partir du document.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default view - before opening document
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Section 7: Historique de faits et évolution</span>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                <span>Téléverser un document</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReviewDocs}
                className="flex items-center gap-2"
                disabled={!uploadedDocumentUrl}
              >
                <Eye className="h-4 w-4" />
                <span>Review Docs</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadedFileName && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                <FileText className="h-4 w-4 inline mr-2" />
                Document téléversé: <strong>{uploadedFileName}</strong>
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Résumé de l'historique
            </label>
            <RichTextEditor
              value={summary}
              onChange={(newValue) => {
                setSummary(newValue);
                onUpdate({ summary: newValue });
              }}
              placeholder="Téléversez un document et cliquez sur 'Review Docs' pour ouvrir le document, puis générez le résumé avec citations..."
            />
          </div>

          {data.generatedAt && (
            <p className="text-xs text-gray-500">
              Généré le {new Date(data.generatedAt).toLocaleString('fr-CA')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
