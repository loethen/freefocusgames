'use client';

import { NextIntlClientProvider, useMessages, useLocale } from 'next-intl';
import Challenge10Seconds from './Challenge10Seconds';

export default function Game() {
    const messages = useMessages();
    const locale = useLocale();

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <Challenge10Seconds />
        </NextIntlClientProvider>
    );
}
