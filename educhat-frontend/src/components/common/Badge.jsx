const Badge = ({ count, className = '' }) => {
  if (!count || count === 0) return null;
  return (
    <span className={`bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full ${className}`}>
      {count > 9 ? '9+' : count}
    </span>
  );
};
export default Badge;