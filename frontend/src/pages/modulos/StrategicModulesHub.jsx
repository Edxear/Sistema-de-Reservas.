import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STRATEGIC_MODULES } from '../../data/strategicModules';
import { hasAnyAllowedRole } from '../../utils/roles';
import { getStrategicModulesSummary } from '../../services/strategicModulesService';
import styles from '../operaciones/OperationalArea.module.css';

export default function StrategicModulesHub() {
  const { user, demoMode } = useAuth();
  const [backendSummary, setBackendSummary] = useState({});
  const [backendEnabled, setBackendEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (demoMode) {
      setBackendSummary({});
      setBackendEnabled(false);
      return undefined;
    }

    getStrategicModulesSummary()
      .then((payload) => {
        if (!mounted) return;
        const summary = (payload.modules || []).reduce((acc, item) => {
          acc[item.slug] = item;
          return acc;
        }, {});
        setBackendSummary(summary);
        setBackendEnabled(payload.localBackend === true);
      })
      .catch(() => {
        if (!mounted) return;
        setBackendSummary({});
        setBackendEnabled(false);
      });

    return () => {
      mounted = false;
    };
  }, [demoMode]);

  const visibleModules = useMemo(
    () => STRATEGIC_MODULES.filter((module) => hasAnyAllowedRole(user, module.allowedRoles)),
    [user],
  );

  const groupedModules = useMemo(() => {
    return visibleModules.reduce((acc, module) => {
      const key = module.category || 'General';
      acc[key] = acc[key] || [];
      acc[key].push(module);
      return acc;
    }, {});
  }, [visibleModules]);

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-tour="modulos-estrategicos-overview">
        <h1>Hub de Modulos Estrategicos</h1>
        <p>Extiende el lenguaje visual de Mantenimiento y Guardia hacia nuevas capacidades clinicas, operativas y de gobierno.</p>
        <div className={styles.metaRow}>
          <span className={styles.metaTag}>Modulos visibles: {visibleModules.length}</span>
          <span className={styles.metaTag}>Diseno unificado</span>
          <span className={styles.metaTag}>Rutas y permisos aplicados</span>
          <span className={styles.metaTag}>{backendEnabled ? 'Backend local activo' : 'Modo visual / demo'}</span>
        </div>
      </section>

      {Object.entries(groupedModules).map(([category, modules]) => (
        <section key={category} className={styles.card}>
          <h2>{category}</h2>
          <div className={styles.grid3} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {modules.map((module) => (
              <article key={module.key} className={styles.panelCard} style={{ borderTop: `4px solid ${module.accent}` }}>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <div className={styles.metaRow}>
                  <span className={styles.metaTag}>{module.tags[0]}</span>
                  {backendSummary[module.slug]?.status && <span className={styles.metaTag}>Estado: {backendSummary[module.slug].status}</span>}
                </div>
                {backendSummary[module.slug]?.highlights?.length > 0 && <p className={styles.note}>{backendSummary[module.slug].highlights[0]}</p>}
                <div className={styles.actionsRow}>
                  <Link to={module.path} className={styles.btnSecondary}>Abrir modulo</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}