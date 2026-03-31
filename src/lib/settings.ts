export const DEFAULT_TEMPLATE = `Hello {{Prénom}},

On est tombées sur {{personnalisation}} et on a eu envie de t'écrire.
On accompagne des praticiennes du bien-être qui ont du mal à stabiliser leur activité malgré leur expertise.

On se permet de te poser une question simple : est-ce que tu arrives aujourd'hui à vivre sereinement de ton activité, ou c'est encore fluctuant ?

Si ça te parle, on a créé un diagnostic rapide (3 min) pour identifier ce qui bloque vraiment : https://tally.so/r/5B2Q2Z

Et si tu veux, on peut te proposer un échange de 20 min pour faire le point ensemble et te donner des pistes concrètes.
Dans tous les cas, tu repartiras avec plus de clarté.
Tu peux simplement nous répondre ici si ça t'intéresse.

À bientôt, CamillexCamille
https://camillexcamille.carrd.co/`

export const DEFAULT_SUBJECT = 'Une question pour toi 🌿'

export function loadSettings() {
  if (typeof window === 'undefined') return { template: DEFAULT_TEMPLATE, subject: DEFAULT_SUBJECT }
  return {
    template: localStorage.getItem('cxc_email_template') ?? DEFAULT_TEMPLATE,
    subject: localStorage.getItem('cxc_email_subject') ?? DEFAULT_SUBJECT,
  }
}
