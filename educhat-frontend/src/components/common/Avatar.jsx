const Avatar = ({ src, alt, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };
  return (
    <img
      src={src || `https://placehold.co/60x60/CCCCCC/4A4A4A?text=${alt ? alt.charAt(0).toUpperCase() : '?'}`}
      alt={alt || 'Avatar'}
      className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/60x60/CCCCCC/4A4A4A?text=${alt ? alt.charAt(0).toUpperCase() : '?'}`; }}
    />
  );
};
export default Avatar;