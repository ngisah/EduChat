const LoadingSpinner = ({ size = 'md', color = 'text-blue-500' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-transparent ${sizeClasses[size]} ${color}`} style={{ borderTopColor: 'currentColor', borderBottomColor: 'currentColor' }}></div>
  );
};

export default LoadingSpinner;