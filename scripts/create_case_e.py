# -*- coding: utf-8 -*-
"""
Manually create case_E files
"""
import pathlib

def create_case_e():
    output_dir = pathlib.Path("data/golden/section7")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create case_E_gold.md with the content from the JSONL
    gold_content = """La travailleuse est une chauffeuse de taxi adapté. Ses tâches consistent à conduire un taxi de transport adapté; elle accompagne les gens en fauteuil roulant et doit monter et descendre des rampes d'accès avec les patients en fauteuil. Parfois, elle transporte des marchandises médicales entre les hôpitaux et conduit jusqu'à Montréal.

La fiche de réclamation de la travailleuse décrit l'événement suivant survenu le 12 août 2020 :

« Je montais une pente à l'hôpital de Valleyfield en poussant un chariot avec des glacières dessus et, à la fin de la pente, j'ai ressenti une grosse douleur au niveau du mollet droit avec sensation de brûlure. Quand fut le temps de reposer mon pied par terre, j'en étais incapable. J'ai tout de suite communiqué avec mon employeur pour lui expliquer ce qui venait de se passer. Comme j'étais déjà dans un hôpital, il m'a dit d'aller tout de suite consulter. Comme l'attente était très longue, je suis partie consulter à un autre hôpital où mon résultat était : déchirure au niveau du mollet. »

La travailleuse consulte la même journée à l'urgence de l'hôpital Barrie Memorial. Elle rencontre le docteur Abdelaziz Balha, qui diagnostique une déchirure du mollet droit. Il prescrit des anti-inflammatoires, des relaxants musculaires et un arrêt de travail de sept jours.

La travailleuse consulte à nouveau à l'urgence de l'hôpital Barrie Memorial pour une douleur accrue au mollet droit, le 19 août 2020. Elle rencontre le docteur Herma Bessaoud, qui prescrit un doppler veineux du membre inférieur droit. L'examen est réalisé et interprété par le docteur Arnold Radu, radiologiste. Le doppler ne démontre aucune thrombophlébite au membre inférieur droit. L'arrêt de travail est prolongé.

La travailleuse revoit le docteur Balha, le 24 août 2020. Il maintient le diagnostic de déchirure du mollet droit et prolonge l'arrêt de travail.

La travailleuse revoit le docteur Balha, le 31 août 2020. Il maintient le diagnostic de déchirure du mollet droit, prescrit un arrêt de travail de deux semaines et ne prévoit pas de suivi supplémentaire.

La travailleuse rencontre le docteur Daniel Leblanc, le 3 novembre 2020. Il maintient le diagnostic de déchirure du mollet droit et prescrit de la physiothérapie et de l'ergothérapie. Il maintient l'arrêt de travail.

La travailleuse rencontre la docteure Adama-Rabi Youla, le 9 février 2021. Elle maintient le diagnostic de déchirure du mollet droit, les traitements en physiothérapie et ergothérapie, et juge la condition clinique stable. Elle prescrit une assignation temporaire à partir du 10 mars 2021.

Le docteur Youla rédige une information complémentaire écrite, mentionnant qu'elle ne peut statuer sur l'évolution de la condition de la patiente puisqu'elle vient de la prendre en charge. Elle précise que le plan de traitement inclut l'ergothérapie, la physiothérapie et une assignation temporaire. Elle prévoit un retour au travail en mai 2021 et estime qu'il n'y aura pas d'atteinte permanente ni de limitation fonctionnelle.

La travailleuse revoit le docteur Youla, le 17 août 2021. Elle maintient le diagnostic de déchirure du mollet droit, note une condition clinique stable et cesse les traitements de physiothérapie et d'ergothérapie. Elle note un arrêt de travail en raison du refus de l'assignation temporaire par l'employeur.

Le dernier rapport de physiothérapie, daté du 23 août 2021, mentionne un plateau thérapeutique et recommande une évaluation des capacités fonctionnelles. Le rapport d'ergothérapie du 24 août 2021 indique une mobilité et une force fonctionnelles du membre inférieur droit et recommande l'arrêt des traitements.

Une résonance magnétique de la jambe droite est réalisée le 17 septembre 2021 et interprétée par le docteur Paul Bajsarowicz, radiologiste. Il observe :

« Les tissus mous de la jambe droite ne démontrent pas d'œdème tissulaire sous-cutané ni d'hypersignal STIR. Il n'y a pas d'évidence de déchirure focale au niveau des structures musculaires et tendineuses du mollet droit. Le muscle gastrocnémien, le soléaire et le tendon d'Achille sont dans les limites de la normale sans atteinte post-traumatique aiguë. Pas d'asymétrie significative, pas d'atrophie graisseuse ni de métaplasie. Pas d'épanchement articulaire du genou ni de l'articulation tibio-astragalienne antérieure. Pas d'évidence de contusion osseuse ni de lésion suspecte. Opinion : IRM de la jambe droite dans les limites de la normale. En particulier, pas d'évidence de déchirure myo-tendineuse, d'œdème tissulaire sous-cutané ou de contusion osseuse à signaler. »"""
    
    # Create gold file
    gold_path = output_dir / "case_e_gold.md"
    gold_path.write_text(gold_content, encoding="utf-8")
    
    # Create input file (placeholder)
    input_path = output_dir / "case_e_input.md"
    input_path.write_text("# Input for case_e\n\n[Placeholder - actual input data needed]", encoding="utf-8")
    
    print(f"Created: {gold_path} and {input_path}")

if __name__ == "__main__":
    create_case_e()
