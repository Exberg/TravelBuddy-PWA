import type { SVGProps } from 'react';
import { publicIconHref, type PublicIconName } from '../lib/icons';

interface PublicIconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: PublicIconName | string;
}

/**
 * Renders a cached SVG from public/icons. The resolver always falls back to
 * `place`, so external API data can never become visible ligature text.
 */
export function PublicIcon({ name, className, ...props }: PublicIconProps) {
  return (
    <svg
      {...props}
      className={className}
      aria-hidden={props['aria-label'] ? undefined : true}
      focusable="false"
    >
      <use href={publicIconHref(name)} />
    </svg>
  );
}
