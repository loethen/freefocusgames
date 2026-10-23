'use client';

import type { MouseEvent, ReactNode } from 'react';
import { analytics } from '@/lib/analytics';

interface LinkClickTrackerProps {
    // Page or section the links live on, e.g. "categories/reaction-time".
    fromPage: string;
    className?: string;
    children: ReactNode;
}

// Records a game_recommendation_click for links inside an element marked with
// data-link-location (the closest marker names the location). Unmarked links,
// such as breadcrumbs, are ignored. Children stay server-rendered.
export default function LinkClickTracker({ fromPage, className, children }: LinkClickTrackerProps) {
    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        const anchor = (event.target as HTMLElement).closest('a');
        if (!anchor || !event.currentTarget.contains(anchor)) return;
        const location = anchor.closest<HTMLElement>('[data-link-location]')?.dataset.linkLocation;
        if (!location) return;

        const path = new URL(anchor.href, window.location.origin).pathname.replace(/^\/zh(?=\/|$)/, '') || '/';
        const gameSlug = path.match(/^\/games\/([^/]+)/)?.[1];

        analytics.navigation.recommendation({
            from_page: fromPage,
            to_page: path,
            game_to: gameSlug ?? '',
            link_location: location,
        });
    };

    return (
        <div className={className} onClickCapture={handleClick}>
            {children}
        </div>
    );
}
