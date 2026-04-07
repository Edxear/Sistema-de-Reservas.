import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Aquí se podría enviar a un servicio de monitoreo (Sentry, etc.)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Ocurrió un error inesperado</h2>
          <p style={styles.message}>
            La aplicación encontró un problema. Por favor recargue la página. Si el error persiste,
            contacte al soporte técnico.
          </p>
          {process.env.NODE_ENV !== 'production' && (
            <pre style={styles.detail}>{this.state.error?.message}</pre>
          )}
          <button style={styles.button} onClick={this.handleReload}>
            Recargar página
          </button>
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f6f9',
    padding: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: '8px',
    padding: '2rem 2.5rem',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.3rem',
    color: '#c0392b',
    marginBottom: '0.75rem',
  },
  message: {
    color: '#555',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  detail: {
    background: '#fdf2f2',
    color: '#c0392b',
    borderRadius: '4px',
    padding: '0.75rem',
    fontSize: '0.8rem',
    textAlign: 'left',
    overflowX: 'auto',
    marginBottom: '1.5rem',
  },
  button: {
    background: '#2980b9',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.6rem 1.4rem',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
};

export default ErrorBoundary;
