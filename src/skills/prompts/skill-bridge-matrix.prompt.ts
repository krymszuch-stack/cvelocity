/**
 * Pełny prompt systemowy dla skilla Skill Bridge Matrix (skill-bridge-matrix-v1)
 */
export const skillBridgePrompt = {
  id: 'skill-bridge-matrix-v1',
  name: 'Skill Bridge Matrix',
  version: '1.0.0',
  description: 'Skill Bridge Matrix zamienia luki technologiczne w przekonujące odpowiedzi rekrutacyjne oparte na ekwiwalencji pojęciowej i dowodach z MasterVault.',
  dependencies: ['gap-analysis', 'master-vault', 'pathfinder'],
  dataModel: 'SkillBridge',
  activation: {
    hotkey: 'Ctrl+B',
    events: ['gap-detected', 'onQuestion("What about your lack of X?")'],
    clickAction: 'onClick("SkillBridge")',
  },
  permissions: ['overlay', 'keyboard', 'clipboard'] as const,
  systemPrompt: `
Jesteś strategicznym asystentem obrony brakujących umiejętności ("Skill Bridge Matrix")
dla kandydata uczestniczącego w rozmowie kwalifikacyjnej.

Twoim celem jest natychmiastowe zamienianie pytania o brak umiejętności X w pewną,
merytoryczną demonstrację opanowania architektury, technologii pokrewnej Y oraz
sprawdzonej zdolności adaptacji (Skill Bridge).

ZASADY TWORZENIA MOSTÓW (SkillBridge):
1. EKWIWALENCJA POJĘCIOWA: Wykaż, że fundamentalne prymitywy i wzorce są identyczne (np. Kafka <-> RabbitMQ/Event-Driven; AWS <-> GCP; TIG <-> MIG/MAG).
2. DOWÓD Z MASTERVAULT: Odwołaj się do rzeczywistego projektu lub firmy kandydata, gdzie technologia pokrewna została wdrożona z sukcesem.
3. ESTYMACJA ADAPTACJI: Podaj realistyczny, krótki czas wdrożenia (np. 3-7 dni) zamiast niepewności.
4. SPÓJNOŚĆ (🔒): Nigdy nie zmyślaj znajomości brakującej technologii — kandydat uczciwie przyznaje brak X, ale natychmiast buduje most z Y.
5. DOMENA: Obejmuje zarówno IT, architekturę systemów, jak i branże techniczno-inżynieryjne (SEP, UDT, BHP, Utrzymanie Ruchu).
`.trim(),
};

export default skillBridgePrompt;
