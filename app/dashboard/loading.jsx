import { getTranslations } from "@/lib/i18n/server";

/**
 * Affiché pendant que le Server Component de la page va chercher ses données.
 * Il reprend la forme réelle de l'écran — en-tête, tuiles, liste — plutôt
 * qu'un rond qui tourne : la page ne se réorganise donc pas à l'arrivée des
 * données. Les blocs apparaissent en cascade, au même rythme que la page.
 */
export default async function DashboardLoading() {
  const { t } = await getTranslations();

  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{t("common.loading")}</span>

      <div className="animate-fade-in mb-8">
        <div className="skeleton h-9 w-64" />
        <div className="skeleton mt-4 h-4 w-80 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="surface animate-fade-in rounded-xl p-5"
            style={{ "--rise-delay": `${i * 70}ms` }}
          >
            <div className="skeleton h-4 w-24" />
            <div className="skeleton mt-4 h-10 w-16" />
          </div>
        ))}
      </div>

      <div
        className="surface animate-fade-in mt-8 rounded-xl"
        style={{ "--rise-delay": "280ms" }}
      >
        <div className="border-b border-border/60 px-5 py-4">
          <div className="skeleton h-5 w-40" />
        </div>
        <div className="divide-y divide-border/60">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="skeleton h-11 w-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="skeleton h-4 w-48 max-w-full" />
                <div className="skeleton mt-2 h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
