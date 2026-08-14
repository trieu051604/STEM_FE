import * as Lucide from 'lucide-react';

interface IconProps extends React.ComponentProps<'svg'> {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 18, className, ...rest }: IconProps) {
  // fall back to Activity if icon not found
  const Comp = (Lucide as any)[name] ?? Lucide.Activity;
  return <Comp size={size} className={className} {...rest} />;
}

export default Icon;
