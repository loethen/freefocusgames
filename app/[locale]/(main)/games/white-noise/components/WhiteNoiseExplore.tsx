import { useLocale, useTranslations } from 'next-intl';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon, WaveIcon, WavesIcon, WindIcon } from '@hugeicons/core-free-icons';
import { GameCover, gameTitleKey } from '@/components/game-card';
import { getGame } from '@/data/games';
import { Link } from '@/i18n/navigation';
import { isPathAvailable } from '@/lib/locale-availability';

const EXPERIENCES = [
    { id: 'focus', gameId: 'pomodoro-timer' },
    { id: 'breathe', gameId: 'resonance-breathing' },
    { id: 'challenge', gameId: 'schulte-table' },
] as const;
const SOUNDS = [
    { id: 'wind', icon: WindIcon },
    { id: 'stream', icon: WavesIcon },
    { id: 'deep', icon: WaveIcon },
] as const;

export default function WhiteNoiseExplore() {
    const locale = useLocale();
    const t = useTranslations('games.whiteNoise');
    const gamesT = useTranslations('games');
    const experiences = EXPERIENCES.flatMap((experience) => {
        const game = getGame(experience.gameId);
        return game && isPathAvailable(locale, `games/${game.slug}`) ? [{ ...experience, game }] : [];
    });

    return (
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-2 sm:px-6 sm:pt-3">
            <div className="grid gap-8 py-6 sm:grid-cols-2 sm:gap-12">
                <section>
                    <h2 className="mb-4 text-sm font-medium">{t('sounds.title')}</h2>
                    <dl className="space-y-4">
                        {SOUNDS.map(({ id, icon }) => (
                            <div key={id}>
                                <dt className="flex items-center gap-2 text-sm font-medium">
                                    <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} aria-hidden="true" />
                                    {t(`sounds.${id}.name`)}
                                </dt>
                                <dd className="mt-1 text-sm leading-6 text-muted-foreground">{t(`sounds.${id}.description`)}</dd>
                            </div>
                        ))}
                    </dl>
                </section>
                <section>
                    <h2 className="mb-4 text-sm font-medium">{t('about.title')}</h2>
                    <p className="text-sm leading-7 text-muted-foreground">{t('about.description')}</p>
                </section>
            </div>

            <section aria-labelledby="white-noise-explore-title" className="mt-12 sm:mt-16">
                <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                    <div className="max-w-xl">
                        <h2 id="white-noise-explore-title" className="text-2xl font-medium tracking-tight">{t('explore.title')}</h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('explore.description')}</p>
                    </div>
                    <Link href="/games" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {t('explore.allGames')}
                        <HugeiconsIcon icon={ArrowRight02Icon} size={18} strokeWidth={1.5} aria-hidden="true" />
                    </Link>
                </div>
                <div className={`grid gap-8 sm:grid-cols-2 ${experiences.length > 2 ? 'lg:grid-cols-3' : ''}`}>
                    {experiences.map(({ id, game }) => {
                        const title = gamesT(`${gameTitleKey(game.id)}.title`);
                        return (
                            <Link key={id} href={`/games/${game.slug}`} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4">
                                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted/50">
                                    <GameCover game={game} title={title} sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 350px" />
                                </div>
                                <div className="pt-4">
                                    <p className="text-xs text-muted-foreground">{t(`explore.${id}.eyebrow`)}</p>
                                    <div className="mt-1 flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-medium tracking-tight">{title}</h3>
                                        <HugeiconsIcon icon={ArrowRight02Icon} size={18} strokeWidth={1.5} className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true" />
                                    </div>
                                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{t(`explore.${id}.description`)}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
