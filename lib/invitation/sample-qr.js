/**
 * QR code d'entrée fictif, pour les invitations d'exemple : galerie des
 * modèles, démo d'ouverture, aperçus et éditeurs. Il montre où chaque invité
 * trouvera le sien (voir guestQrBlock dans lib/invitation/document.js) ; les
 * vraies invitations portent le QR code de l'invité (lib/invitation/guest-qr.js).
 *
 * Code fictif, celui de la page d'accueil. Le SVG est écrit ici une fois pour
 * toutes, plutôt que généré dans le navigateur : les pages publiques n'ont
 * pas à charger la bibliothèque des QR codes, et l'aperçu est construit du
 * premier coup, sans attendre le QR. Il a été produit par `ticketQrSvg`
 * (lib/qr.js) à partir de « 7K3MQ9PX2HTA ».
 *
 * Module pur, importable côté serveur comme côté client.
 */
export const SAMPLE_GUEST_QR = Object.freeze({
  code: "7K3M-Q9PX-2HTA",
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" shape-rendering="crispEdges"><path fill="#ffffff" d="M0 0h23v23H0z"/><path stroke="#100d0b" d="M1 1.5h7m1 0h2m1 0h2m1 0h7M1 2.5h1m5 0h1m2 0h2m3 0h1m5 0h1M1 3.5h1m1 0h3m1 0h1m3 0h2m2 0h1m1 0h3m1 0h1M1 4.5h1m1 0h3m1 0h1m1 0h2m1 0h1m2 0h1m1 0h3m1 0h1M1 5.5h1m1 0h3m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h3m1 0h1M1 6.5h1m5 0h1m1 0h2m1 0h1m2 0h1m5 0h1M1 7.5h7m1 0h1m1 0h1m1 0h1m1 0h7M9 8.5h5M1 9.5h1m3 0h1m1 0h4m1 0h1m1 0h5m2 0h1M1 10.5h1m1 0h2m1 0h1m1 0h2m1 0h3m1 0h1m1 0h1m1 0h1M1 11.5h2m2 0h3m2 0h3m3 0h1m3 0h2M4 12.5h1m1 0h1m1 0h3m3 0h1m3 0h1M1 13.5h3m1 0h3m1 0h2m2 0h2m2 0h2m2 0h1M9 14.5h2m2 0h3m1 0h1m3 0h1M1 15.5h7m1 0h1m3 0h1m3 0h1m1 0h1M1 16.5h1m5 0h1m2 0h1m1 0h2m2 0h3m2 0h1M1 17.5h1m1 0h3m1 0h1m1 0h1m1 0h2m1 0h2m5 0h1M1 18.5h1m1 0h3m1 0h1m2 0h4m2 0h6M1 19.5h1m1 0h3m1 0h1m2 0h3m2 0h5M1 20.5h1m5 0h1m3 0h1m2 0h4m1 0h1m1 0h1M1 21.5h7m1 0h1m3 0h4m3 0h2"/></svg>',
});
