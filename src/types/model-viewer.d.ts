// Type declarations for @google/model-viewer custom element
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        'auto-rotate'?: boolean | '';
        'camera-controls'?: boolean | '';
        'shadow-intensity'?: string;
        exposure?: string;
        ar?: boolean | '';
        'ar-modes'?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        style?: React.CSSProperties;
      },
      HTMLElement
    >;
  }
}
