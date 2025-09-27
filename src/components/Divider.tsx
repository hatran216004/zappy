import React from 'react';

type DividerProps = {
  children?: React.ReactNode;
};

export default function Divider({ children }: DividerProps) {
  return (
    <div className="mt-8 mb-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">{children}</span>
        </div>
      </div>
    </div>
  );
}
