export default function getSearchParams(value: any) {
  if (!value) return null;
  if (value === 'undefined' || value === 'null') return null;
  else return value;
}
