import type { ComponentProps } from "react";
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
const {
    Link: BaseLink,
    redirect,
    usePathname,
    useRouter,
    getPathname,
} = createNavigation(routing);

type LinkProps = ComponentProps<typeof BaseLink>;

export function Link(props: LinkProps) {
    return <BaseLink {...props} />;
}

export { redirect, usePathname, useRouter, getPathname };
