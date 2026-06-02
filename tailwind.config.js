/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html", // Scanne les fichiers HTML à la racine
    "./src/**/*.{html,js}" // Scanne les fichiers HTML et JS dans un dossier src (ajustez si besoin)
    // Ajoutez d'autres chemins si nécessaire (ex: pour des templates JS)
  ],
  theme: {
    extend: {
      colors: {
        'freelabz-yellow': '#FFD700', // Ou votre teinte de jaune exacte
        'freelabz-bg': '#111827',     // Gris très foncé / Presque noir
        'freelabz-card': '#1F2937',   // Gris un peu plus clair pour les cartes
        'freelabz-text': '#E5E7EB',   // Texte gris clair
        'freelabz-text-dark': '#000000', // Texte noir pour les éléments sur fond jaune
      },
      fontFamily: {
        'display': ['Space Grotesk', 'ui-sans-serif', 'system-ui'],
      }
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/line-clamp"),
    require("@tailwindcss/aspect-ratio"),
  ],
}