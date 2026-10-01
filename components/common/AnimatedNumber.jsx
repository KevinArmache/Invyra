/**
 * Un nombre entier qui monte de 0 à sa valeur, sans JavaScript (voir
 * `.count-up` dans globals.css). Utilisable dans un composant serveur comme
 * dans un composant client.
 *
 * Le chiffre animé est décoratif ; la valeur réelle est donnée une seule
 * fois aux lecteurs d'écran. Une valeur qui n'est pas un entier positif
 * (« — », « 4,5 ») s'affiche telle quelle.
 *
 * @param {number|string} props.value
 * @param {string} [props.suffix]  ajouté après le nombre (« % »)
 * @param {number} [props.delay]   départ différé, en ms
 */
export default function AnimatedNumber({ value, suffix = "", delay, className }) {
  const number = typeof value === "string" ? Number(value) : value;

  if (!Number.isInteger(number) || number < 0) {
    return (
      <span className={className}>
        {value}
        {suffix}
      </span>
    );
  }

  return (
    <span className={className}>
      <span
        aria-hidden="true"
        className="count-up"
        style={{
          "--to": number,
          ...(delay != null && { "--count-delay": `${delay}ms` }),
        }}
      />
      {suffix && <span aria-hidden="true">{suffix}</span>}
      <span className="sr-only">
        {number}
        {suffix}
      </span>
    </span>
  );
}
