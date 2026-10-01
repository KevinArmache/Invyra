/** Même arrivée en fondu que l'espace principal (voir app/dashboard/template.jsx). */
export default function AdminTemplate({ children }) {
  return <div className="animate-page-in">{children}</div>;
}
