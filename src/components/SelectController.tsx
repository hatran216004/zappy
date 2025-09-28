/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Control, Controller } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

type SelectControllerProps = {
  control: Control<any>;
  fieldName: string;
  className?: string;
  errorMessage?: string;
  placeholder: string;
  options: { label: string; value: string }[];
};

export default function SelectController({
  control,
  fieldName,
  errorMessage,
  className = '',
  placeholder = 'Select',
  options
}: SelectControllerProps) {
  return (
    <div>
      <Controller
        control={control}
        name={fieldName}
        render={({ field: { value, onChange } }) => {
          return (
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger
                className={twMerge('w-[180px] border-gray-200', className)}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((otp) => (
                  <SelectItem value={otp.value} key={otp.value}>
                    {otp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }}
      />
      {errorMessage && (
        <span className="text-red-500 text-sm">{errorMessage}</span>
      )}
    </div>
  );
}
