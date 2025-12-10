import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/upload', label: 'Upload', icon: '📤' },
    { path: '/packets', label: 'Packets', icon: '📦' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isDisabled = item.disabled;

            if (isDisabled) {
              return (
                <div
                  key={item.path}
                  className="flex flex-col items-center justify-center px-4 py-2 text-gray-400 cursor-not-allowed"
                >
                  <span className="text-xl mb-1">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center px-4 py-2 transition-colors",
                  isActive
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

