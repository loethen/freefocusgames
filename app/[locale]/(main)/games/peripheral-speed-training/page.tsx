import { permanentRedirect } from "next/navigation";

export default async function LegacyPeripheralSpeedTrainingPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const localePrefix = locale === "en" ? "" : `/${locale}`;

    permanentRedirect(`${localePrefix}/games/double-decision`);
}
