import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStrategicModule } from '../../data/strategicModules';
import { getAreaFunctionCatalog } from '../../data/areaFunctionCatalog';
import { hasAnyAllowedRole } from '../../utils/roles';
import { getStrategicModuleDetail } from '../../services/strategicModulesService';
import NutricionDietoterapiaArea from './NutricionDietoterapiaArea';
import styles from '../operaciones/OperationalArea.module.css';

const FUNCTION_STATUS_LABEL = {
  operativa: 'Operativa',
  parcial: 'Parcial',
  planificada: 'Planificada',
};

function getStatusClass(status) {
  if (status === 'operativa') return styles.badgeOk;
  if (status === 'parcial') return styles.badgeWarn;
  return styles.badgeDanger;
}

function renderTab(tab) {
  if (tab.kind === 'cards') {
    return (
      <section className={styles.grid3}>
        {tab.items.map((item) => (
          <article key={item.title} className={styles.panelCard}>
            <h3>{item.title}</h3>
            {item.lines.map((line) => <p key={line}>{line}</p>)}
          </article>
        ))}
      </section>
    );
  }

  if (tab.kind === 'table') {
    return (
      <section className={styles.card}>
        <h2>{tab.title}</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {tab.columns.map((column) => <th key={column}>{column}</th>)}
              </tr>
            </thead>
            <tbody>
              {tab.rows.map((row) => (
                <tr key={row.join('|')}>
                  {row.map((value) => <td key={value}>{value}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <h2>{tab.title}</h2>
      <div className={styles.listWrap}>
        {tab.items.map((item) => (
          <article key={item.title} className={styles.item}>
            <div className={styles.itemTitle}>{item.title}</div>
            <div className={styles.itemMeta}>{item.meta}</div>
            <div className={styles.note}>{item.detail}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function StrategicModuleArea() {
  const { moduleSlug, sectionKey } = useParams();
  const navigate = useNavigate();
  const { user, demoMode } = useAuth();
  const module = getStrategicModule(moduleSlug);
  const initialTab = (module?.tabs || []).find((tab) => tab.key === sectionKey)?.key || module?.tabs?.[0]?.key || 'panel';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [backendDetail, setBackendDetail] = useState(null);

  useEffect(() => {
    const fallbackTab = module?.tabs?.[0]?.key || 'panel';
    const resolvedTab = (module?.tabs || []).find((tab) => tab.key === sectionKey)?.key || fallbackTab;
    setActiveTab(resolvedTab);

    if (module && sectionKey && !(module.tabs || []).some((tab) => tab.key === sectionKey)) {
      navigate(`/modulos/${module.slug}/${fallbackTab}`, { replace: true });
    }
  }, [moduleSlug, module, sectionKey, navigate]);

  useEffect(() => {
    let mounted = true;

    if (!module || demoMode) {
      setBackendDetail(null);
      return undefined;
    }

    getStrategicModuleDetail(module.slug)
      .then((payload) => {
        if (!mounted) return;
        setBackendDetail(payload.module || null);
      })
      .catch(() => {
        if (!mounted) return;
        setBackendDetail(null);
      });

    return () => {
      mounted = false;
    };
  }, [demoMode, module, moduleSlug]);

  if (!module) return <Navigate to="/modulos-estrategicos" replace />;
  if (!hasAnyAllowedRole(user, module.allowedRoles)) return <Navigate to="/dashboard" replace />;

  const currentTab = module.tabs.find((tab) => tab.key === activeTab) || module.tabs[0];
  const functionCatalog = getAreaFunctionCatalog(module.slug);
  const buildTabPath = (tabKey) => `/modulos/${module.slug}/${tabKey}`;

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-tour="strategic-module-overview" style={{ borderColor: `${module.accent}33`, background: `linear-gradient(180deg, ${module.accent}12 0%, #f8fbff 100%)` }}>
        <h1>{module.title}</h1>
        <p>{module.description}</p>
        <div className={styles.metaRow}>
          <span className={styles.metaTag}>{module.category}</span>
          {module.tags.map((tag) => <span key={tag} className={styles.metaTag}>{tag}</span>)}
          <span className={styles.metaTag}>{backendDetail ? 'Estado operativo validado' : 'Estado operativo estándar'}</span>
          {backendDetail?.owner && <span className={styles.metaTag}>Owner: {backendDetail.owner}</span>}
        </div>
        <div className={styles.grid3} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {(backendDetail?.liveMetrics || module.metrics).map((metric) => (
            <article key={metric.label} className={styles.panelCard}>
              <h3 style={{ color: module.accent }}>{metric.value}</h3>
              <p>{metric.label}</p>
            </article>
          ))}
        </div>
        <div className={styles.actionsRow}>
          <Link to="/modulos-estrategicos" className={styles.btnSecondary}>Volver al hub de modulos</Link>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {module.tabs.map((tab) => (
            <Link
              key={tab.key}
              to={buildTabPath(tab.key)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: activeTab === tab.key ? module.accent : '#e5e7eb',
                color: activeTab === tab.key ? '#fff' : '#1f2937',
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600',
                textDecoration: 'none', display: 'inline-block',
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className={styles.metaRow} style={{ marginTop: '0.5rem' }}>
          <span>Usuario activo: {user?.nombre || 'Sin sesión'}</span>
          <span>Rol: {user?.rol || '-'}</span>
        </div>
      </section>

      {module.slug === 'nutricion-dietoterapia' && <NutricionDietoterapiaArea />}

      {module.slug !== 'nutricion-dietoterapia' && renderTab(currentTab)}

      <section className={styles.card} data-tour="strategic-module-functional-matrix">
        <h2>Matriz funcional del área</h2>
        <p className={styles.note}>{functionCatalog.objective}</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Función</th>
                <th>Objetivo</th>
                <th>Acción</th>
                <th>Disponibilidad</th>
                <th>Estado</th>
                <th>Uso recomendado</th>
              </tr>
            </thead>
            <tbody>
              {functionCatalog.actions.map((action) => (
                <tr key={`${module.slug}-${action.name}`}>
                  <td>{action.name}</td>
                  <td>{action.purpose}</td>
                  <td>
                    {action.frontendRoute ? (
                      <Link to={action.frontendRoute} className={styles.btnSecondary}>Abrir flujo</Link>
                    ) : (
                      <span className={styles.note}>Sin acción directa</span>
                    )}
                  </td>
                  <td>
                    {action.backend || action.frontendRoute ? 'Disponible en módulo' : <span className={styles.note}>En definición</span>}
                  </td>
                  <td>
                    <span className={getStatusClass(action.status)}>
                      {FUNCTION_STATUS_LABEL[action.status] || 'Planificada'}
                    </span>
                  </td>
                  <td>{action.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {backendDetail && (
        <section className={styles.grid2}>
          <article className={styles.card}>
            <h2>Checkpoints operativos</h2>
            <div className={styles.listWrap}>
              {backendDetail.checkpoints.map((item) => (
                <div key={item.name} className={styles.item}>
                  <div className={styles.actionsRow}>
                    <span className={styles.itemTitle}>{item.name}</span>
                    <span className={item.state === 'ok' ? styles.badgeOk : item.state === 'warn' ? styles.badgeWarn : styles.badgeDanger}>
                      {item.state}
                    </span>
                  </div>
                  <div className={styles.note}>{item.note}</div>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.card}>
            <h2>Roadmap de implementación</h2>
            <div className={styles.listWrap}>
              {backendDetail.timeline.map((item) => (
                <div key={item.event} className={styles.item}>
                  <div className={styles.itemTitle}>{item.event}</div>
                  <div className={styles.itemMeta}>{item.eta}</div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}