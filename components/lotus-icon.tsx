import type { SVGProps } from "react";

// Lotus outline drawn to match lucide-react's 24px, 2px-stroke style.
export function LotusIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M12 4c-2 2.5-2.6 5.4-2.6 8 0 2.7 1 4.9 2.6 6 1.6-1.1 2.6-3.3 2.6-6 0-2.6-.6-5.5-2.6-8Z" />
            <path d="M9.6 10.4C7.6 9 5.2 8.6 3 9c.3 4.1 3 8 9 9" />
            <path d="M14.4 10.4C16.4 9 18.8 8.6 21 9c-.3 4.1-3 8-9 9" />
            <path d="M6 21c2-.6 4-.9 6-.9s4 .3 6 .9" />
        </svg>
    );
}
