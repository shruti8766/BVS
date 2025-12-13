export default function Toast({ message, type = 'info' }) {
  const base = 'p-4 rounded-lg shadow-lg border max-w-sm';
  const styles =
    type === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : type === 'error'
      ? 'bg-red-50 border-red-200 text-red-800'
      : 'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <div className={`${base} ${styles}`} role="alert">
      {message}
    </div>
  );
}