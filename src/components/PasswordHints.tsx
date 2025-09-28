/* eslint-disable @typescript-eslint/no-explicit-any */
import clsx from 'clsx';
import { Check, X } from 'lucide-react';
import { useWatch, Control } from 'react-hook-form';

type PasswordHintsProps = {
  control: Control<any>;
  name: string;
};

const rules = [
  { regex: /.{8,}/, label: 'Ít nhất 8 ký tự' },
  { regex: /[a-z]/, label: 'Có chữ thường (a-z)' },
  { regex: /[A-Z]/, label: 'Có chữ hoa (A-Z)' },
  { regex: /[0-9]/, label: 'Có số (0-9)' },
  {
    regex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/,
    label: 'Có ký tự đặc biệt (!@#$...)'
  }
];

export function PasswordHints({ control, name }: PasswordHintsProps) {
  const value = useWatch({ control, name }) || '';

  return (
    <ul className="space-y-1 text-sm">
      {rules.map((r) => {
        const ok = r.regex.test(value);
        return (
          <li
            key={r.label}
            className={clsx(
              'flex items-center gap-2',
              ok ? 'text-green-600' : 'text-gray-500'
            )}
          >
            {ok ? <Check size={14} /> : <X size={14} />}
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}
