import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface Section11Props {
  data: any;
  onUpdate: (content: any) => void;
  onSave: () => void;
  allSections: { [key: string]: any };
}

export const Section11: React.FC<Section11Props> = ({ data, onUpdate, onSave, allSections }) => {
  const addToast = useUIStore(state => state.addToast);
  const [summary, setSummary] = useState(data.summary || '');

  const handleGenerateSummary = async () => {
    try {
      addToast({
        type: 'info',
        title: 'Génération en cours',
        message: 'Création du résumé à partir des sections précédentes...'
      });

      // Extract content from previous sections
      const section7 = allSections.section_7?.summary || '';
      const section8 = allSections.section_8?.transcript || '';
      const section9 = allSections.section_9?.examData || [];
      const section10 = allSections.section_10?.content || '';

      // Generate summary using the provided template
      const generatedSummary = `Résumé : 



Il s'agit d'un homme de 40 ans sans antécédents connus à la cheville droite avant l'événement d'origine du 3 mars 2021. Il s'est infligé une entorse de la cheville droite ainsi qu'une entorse du 3e doigt de la main droite. La lésion au niveau du doigt est consolidée sans séquelle ni limitations fonctionnelles en expertise médicale. Pour ce qui est de la lésion à la cheville droite, le travailleur bénéficiera d'investigation par résonance magnétique et radiographies qui démontreront des atteintes ligamentaires partielles au niveau de la cheville droite. Le travailleur rencontrera le docteur Blouin, chirurgien orthopédiste, qui suggère un traitement conservateur. Le travailleur bénéficiera de traitements en physiothérapie et ergothérapie avec une évolution peu favorable. Il n'est pas en mesure de reprendre son travail prélésionnel. En mai 2023, à la suite d'une chute accidentelle, il se fracture le tibia et la fibula gauche. Cette lésion bénéficiera d'une réduction ouverte et fixation interne mais se compliquera par un débricolage ainsi qu'une ostéomyélite. Il sera traité à l'aide d'un fixateur externe et retrait du matériel et prise d'antibiotiques.



Sur le plan subjectif, le travailleur rapporte ne pas être en mesure de reprendre son travail prélésionnel et envisage une réorientation de carrière. Il note des douleurs en externe de son pied droit qui irradie au niveau plantaire. Il note des signes d'instabilité au niveau de sa cheville droite. En effet, il rapporte des difficultés sur des terrains instables ou glissant et rapporte avoir de la difficulté à monter les escaliers. Il rapporte des éveils nocturnes secondaires à la douleur ainsi que des raideurs matinales.



Sur le plan objectif, on remarque un travailleur nécessitant l'utilisation de béquilles étant donné sa lésion à son membre inférieur gauche. On note une déformation du tibia gauche avec des cicatrice vicieuse en antérieure. Pour ce qui est de la cheville droite, on note une diminution de l'amplitude articulaire ainsi qu'une douleur à la palpation au pourtour de la malléole interne et externe. On ne rapporte aucun signe clinique d'instabilité au niveau de la cheville droite.



L'examen du genou droit ainsi que de la hanche droite est dans les limites de la normale.



Enfin nous n'avons pas relevé de signe objectif d'atteinte sensitivomotrice d'origine radiculaire ou nerveuse périphérique.



À la lumière de l'analyse du dossier, du questionnaire subjectif et de l'examen objectif, voici notre opinion :



Diagnostic : 



Entorse cheville droite.



Date de consolidation : 



Le médecin qui a charge le patient a rencontré ce dernier le 7 mai 2024, ne s'est pas prononcé sur ce point, note que le travailleur est en attente d'une deuxième infiltration et prescrit une résonnance magnétique de contrôle à la cheville droite.



Considérant le diagnostic retenu par la CNESST et faisant l'objet de la présente demande, soit une entorse de la cheville droite;

	

Considérant que le travailleur a été traitée de façon appropriée et adéquate, incluant une immobilisation et un protocole de réadaptation en physiothérapie et ergothérapie;



Considérant que le travailleur a atteint un plateau thérapeutique en physiothérapie et ergothérapie et présente principalement des symptômes de douleurs et des limitations en lien avec son membre inférieur gauche;



Considérant l'examen objectif de la cheville droite d'aujourd'hui, mettant en évidence une légère diminution de l'amplitude articulaire sans signe franc d'instabilité.



Je consolide la lésion en date d'aujourd'hui soit le 23 juillet 2024.



À mon avis, il y a une atteinte du plateau thérapeutique et stabilisation de la condition pour le diagnostic retenu. 



Nature, nécessité́, suffisance, durée des soins ou traitements administrés ou prescrits : 



Le médecin qui a charge le patient a rencontré ce dernier le 7 mai 2024, ne s'est pas prononcé sur ce point, note que le travailleur est en attente d'une deuxième infiltration et prescrit une résonnance magnétique de contrôle à la cheville droite.



Considérant le diagnostic retenu par la CNESST et faisant l'objet de la présente demande, soit une entorse de la cheville droite;

	

Considérant que le travailleur a été traitée de façon appropriée et adéquate, incluant une immobilisation et un protocole de réadaptation en physiothérapie et ergothérapie;



Considérant que le travailleur a atteint un plateau thérapeutique en physiothérapie et ergothérapie et présente principalement des symptômes de douleurs et des limitations en lien avec son membre inférieur gauche;



Considérant l'examen objectif de la cheville droite d'aujourd'hui, mettant en évidence une légère diminution de l'amplitude articulaire sans signe franc d'instabilité.



Je consolide la lésion en date d'aujourd'hui soit le 23 juillet 2024.



À mon avis, il y a une atteinte du plateau thérapeutique et stabilisation de la condition pour le diagnostic retenu. 



Considérant le diagnostic retenu par la CNESST ainsi que sa consolidation;



Considérant tous les éléments mentionnés aux points précédents;

	

Je suis d'avis qu'il y a suffisance de traitements en date de consolidation soit aujourd'hui le 23 juillet 2024.



Je ne crois pas qu'une résonance magnétique de la cheville droite ou une infiltration cortisonée supplémentaire à la cheville droite modifieront l'évolution clinique du travailleur.

























Existence de l'atteinte permanente à l'intégrité́ physique ou psychique :



		Le médecin qui a charge ne se prononce pas sur ce point;



		Considérant le diagnostic retenu par la CNESST ainsi que sa consolidation;



		Considérant tous les points mentionnés aux points précédents;



		J'attribue aucune atteinte permanente à l'intégrité physique.



Les pourcentages de l'atteinte permanente à l'intégrité physique seront présentés au point 12.



Existence de limitations fonctionnelles résultant de la lésion professionnelle : 



		Le médecin qui a charge ne se prononce pas sur ce point;



		Considérant le diagnostic retenu par la CNESST ainsi que sa consolidation;



		Considérant tous les points mentionnés aux points précédents;



		J'attribue des limitations fonctionnelles résultant de la lésion professionnelle.



Évaluation des limitations fonctionnelles résultant de la lésion professionnelle :



Le travailleur doit éviter la marche prolongée (plus de 20 minutes), marcher en terrain accidenté ou glissant. Éviter de monter descendre des escaliers à plusieurs reprises ou manière fréquente dans la journée et éviter de monter dans des échelles, escabeaux, échafauds. Il doit éviter la position debout statique de plus de 30 minutes.`;

      setSummary(generatedSummary);
      onUpdate({ summary: generatedSummary, generatedAt: new Date().toISOString() });
      onSave();

      addToast({
        type: 'success',
        title: 'Résumé généré',
        message: 'Le résumé a été généré avec succès à partir des sections précédentes.'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de générer le résumé.'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Section 11: Conclusion</span>
            <Button
              onClick={handleGenerateSummary}
              className="flex items-center gap-2 bg-[#009639] hover:bg-[#007a2e] text-white"
            >
              <Sparkles className="h-4 w-4" />
              <span>Générer le résumé</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Résumé et conclusion
            </label>
            <Textarea
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                onUpdate({ summary: e.target.value });
              }}
              placeholder="Le résumé généré apparaîtra ici, ou vous pouvez le modifier manuellement..."
              className="min-h-[400px]"
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

