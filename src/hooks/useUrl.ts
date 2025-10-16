import { useSearchParams } from 'react-router';

function useUrl({
  field,
  defaultValue
}: {
  field: string;
  defaultValue?: string;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentValue = searchParams.get(field) || defaultValue;

  const handler = (value: string) => {
    const newParams = new URLSearchParams(searchParams);

    newParams.set(field, value);
    setSearchParams(newParams);
  };

  return { currentValue, handler };
}

export default useUrl;
