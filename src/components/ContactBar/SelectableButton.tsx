import clsx from 'clsx';
import { Link, useLocation } from 'react-router';

type SelectableButtonProps = {
  label: string;
  url: string;
  icon: React.ElementType;
};

export default function SelectableButton({
  label,
  icon: Icon,
  url
}: SelectableButtonProps) {
  const { pathname } = useLocation();
  const isActive = pathname.endsWith(url);

  return (
    <Link
      to={`friends${url}`}
      className={clsx(
        'rounded-none flex items-center justify-start gap-3 px-3 py-6 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer',
        isActive &&
          'bg-blue-500/20 dark:bg-blue-500/30 text-black dark:text-white'
      )}
    >
      <Icon className="size-5" /> {/* 👈 icon auto size */}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

/*


*/
