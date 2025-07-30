import Image from 'next/image';
import { Icon } from './icons';

export function LogoIcon({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center items-center mb-6 ${className || ''}`}>
      <Image src={Icon.logo} alt="Acash Logo" width={120} height={40} priority />
    </div>
  );
} 