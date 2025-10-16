// src/components/BottomNav.tsx
'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
// Import the new Phosphor Duotone icons
import { ClockCounterClockwise, Camera, User } from 'phosphor-react';

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'History', Icon: ClockCounterClockwise, href: '/history' },
    { name: 'Camera', Icon: Camera, href: '/' },
    { name: 'Profile', Icon: User, href: '/profile' },
  ];

  return (
    // The main container is now smaller (h-14)
    <nav className="fixed bottom-0 left-0 right-0 w-full max-w-sm mx-auto bg-white rounded-t-xl border-t-2 border-x-2 border-black shadow-lg z-50">
      <div className="flex justify-around items-center h-14"> {/* Reduced height */}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.name} className="flex-1 h-full flex items-center justify-center border-r-2 border-black last:border-r-0">
              <item.Icon 
                size={28} // Phosphor icons look great at this size
                weight="duotone" // Use the duotone style
                className={isActive ? 'text-black' : 'text-gray-400 hover:text-gray-600'} 
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;