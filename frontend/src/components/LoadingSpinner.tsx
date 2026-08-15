export default function LoadingSpinner({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      <span className="loading-text">{text}</span>
    </div>
  );
}
