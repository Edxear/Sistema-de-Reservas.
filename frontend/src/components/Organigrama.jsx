import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  createOrganigrama,
  deleteOrganigrama,
  getOrganigrama,
  getOrganigramaAudit,
  reorderOrganigrama,
  updateOrganigrama,
} from '../services/organigramaService';
import organigramaHospitalario from '../data/organigramaHospitalario.json';
import styles from './Organigrama.module.css';

const estructuraEjemplo = organigramaHospitalario.bloques || [];

const normalizar = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const sortByOrder = (a, b) => (a.orden || 0) - (b.orden || 0) || String(a.area || '').localeCompare(String(b.area || ''));

const parsePuestos = (text = '') => {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nombreRaw, personasRaw = ''] = line.split(':');
      const nombre = String(nombreRaw || '').trim();
      const personas = String(personasRaw || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      return { nombre, personas };
    })
    .filter((p) => p.nombre);
};

const formatPuestos = (puestos = []) => {
  return (puestos || [])
    .map((p) => `${p.nombre}: ${(p.personas || []).join(', ')}`)
    .join('\n');
};

export default function Organigrama() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin' || user?.rol === 'superadmin';
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
  const [editId, setEditId] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [viewMode, setViewMode] = useState('cards');
  const [dragId, setDragId] = useState('');
  const [dragOverId, setDragOverId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState({});
  const [inlineEditId, setInlineEditId] = useState('');
  const [inlinePuestosText, setInlinePuestosText] = useState('');
  const [inlineSaving, setInlineSaving] = useState(false);
  const [auditRows, setAuditRows] = useState([]);
  const [auditMeta, setAuditMeta] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });
  const [auditLoading, setAuditLoading] = useState(false);
  const formSectionRef = useRef(null);
  const areaInputRef = useRef(null);
  const exportSectionRef = useRef(null);
  const [form, setForm] = useState({
    area: '',
    parentId: '',
    jefe: '',
    subjefe: '',
    orden: 0,
    activo: true,
    equiposText: '',
    puestosText: '',
  });

  const hasData = rows.length > 0;
  const canReorder = isAdmin && !usingLocalFallback && !debouncedQuery.trim() && statusFilter === 'todos' && currentPage === 1 && pageSize >= 100;

  const payloadFromForm = useMemo(
    () => ({
      area: form.area.trim(),
      parentId: form.parentId || null,
      jefe: form.jefe.trim(),
      subjefe: form.subjefe.trim(),
      orden: Number(form.orden) || 0,
      activo: !!form.activo,
      equipos: form.equiposText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      puestos: parsePuestos(form.puestosText),
    }),
    [form]
  );

  const treeRows = useMemo(() => {
    const byId = new Map(rows.map((row) => [String(row._id), { ...row, children: [] }]));
    const roots = [];

    byId.forEach((node) => {
      const parentId = node.parentId ? String(node.parentId) : '';
      if (parentId && byId.has(parentId)) {
        byId.get(parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortTree = (nodes) => {
      nodes.sort(sortByOrder);
      nodes.forEach((node) => sortTree(node.children));
    };
    sortTree(roots);

    return roots;
  }, [rows]);

  const metrics = useMemo(() => {
    const total = meta.totalItems || rows.length;
    const activos = rows.filter((r) => r.activo !== false).length;
    const puestos = rows.reduce((acc, row) => acc + (row.puestos?.length || 0), 0);
    const personas = rows.reduce(
      (acc, row) => acc + (row.puestos || []).reduce((sum, p) => sum + (p.personas?.length || 0), 0),
      0
    );
    return { total, activos, puestos, personas };
  }, [rows]);

  const resetForm = () => {
    setEditId('');
    setForm({ area: '', parentId: '', jefe: '', subjefe: '', orden: 0, activo: true, equiposText: '', puestosText: '' });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOrganigrama({
        status: statusFilter,
        q: debouncedQuery,
        page: currentPage,
        limit: pageSize,
      });
      setRows(data?.items || []);
      setMeta(data?.meta || { page: 1, limit: pageSize, totalItems: 0, totalPages: 1 });
      setUsingLocalFallback(false);
    } catch (error) {
      const fallbackAll = (estructuraEjemplo || []).map((item, idx) => ({ ...item, _id: `local-${idx + 1}` }));
      const fallbackFiltered = fallbackAll.filter((row) => {
        if (statusFilter === 'activos' && row.activo === false) return false;
        if (statusFilter === 'inactivos' && row.activo !== false) return false;
        if (!debouncedQuery) return true;
        const scope = [
          row.area,
          row.jefe,
          row.subjefe,
          ...(row.equipos || []),
          ...((row.puestos || []).map((p) => p.nombre)),
          ...((row.puestos || []).flatMap((p) => p.personas || [])),
        ]
          .filter(Boolean)
          .join(' ');
        return normalizar(scope).includes(normalizar(debouncedQuery));
      });

      const totalItems = fallbackFiltered.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const safePage = Math.min(currentPage, totalPages);
      const start = (safePage - 1) * pageSize;
      setRows(fallbackFiltered.slice(start, start + pageSize));
      setMeta({ page: safePage, limit: pageSize, totalItems, totalPages, hasNextPage: safePage < totalPages, hasPrevPage: safePage > 1 });
      setUsingLocalFallback(true);
      toast.warn(error.response?.data?.message || 'No se pudo cargar desde API. Se muestra el ejemplo local.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, statusFilter, pageSize]);

  useEffect(() => {
    loadData();
  }, [debouncedQuery, statusFilter, currentPage, pageSize]);

  const loadAudit = async (page = 1) => {
    if (!isAdmin) return;
    setAuditLoading(true);
    try {
      const data = await getOrganigramaAudit({ page, limit: 10 });
      setAuditRows(data?.items || []);
      setAuditMeta(data?.meta || { page: 1, limit: 10, totalItems: 0, totalPages: 1 });
    } catch {
      setAuditRows([]);
      setAuditMeta({ page: 1, limit: 10, totalItems: 0, totalPages: 1 });
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadAudit(1);
  }, [isAdmin]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!payloadFromForm.area || !payloadFromForm.jefe) {
      toast.error('Área y jefe son obligatorios');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await updateOrganigrama(editId, payloadFromForm);
        toast.success('Bloque actualizado');
      } else {
        await createOrganigrama(payloadFromForm);
        toast.success('Bloque creado');
      }
      resetForm();
      await loadData();
      await loadAudit(auditMeta.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar el bloque');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row) => {
    setEditId(row._id);
    setForm({
      area: row.area || '',
      parentId: row.parentId || '',
      jefe: row.jefe || '',
      subjefe: row.subjefe || '',
      orden: row.orden || 0,
      activo: row.activo !== false,
      equiposText: (row.equipos || []).join(', '),
      puestosText: formatPuestos(row.puestos || []),
    });

    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      areaInputRef.current?.focus();
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm('¿Eliminar este bloque del organigrama?')) return;
    try {
      await deleteOrganigrama(id);
      toast.success('Bloque eliminado');
      if (editId === id) resetForm();
      await loadData();
      await loadAudit(auditMeta.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar');
    }
  };

  const onDragStart = (id) => {
    setDragId(id);
  };

  const onDropReorder = async (targetId) => {
    if (!dragId || dragId === targetId || !canReorder) {
      setDragId('');
      setDragOverId('');
      return;
    }

    const base = [...rows].sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const from = base.findIndex((item) => item._id === dragId);
    const to = base.findIndex((item) => item._id === targetId);
    if (from < 0 || to < 0) {
      setDragId('');
      setDragOverId('');
      return;
    }

    const reordered = [...base];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const withOrder = reordered.map((item, index) => ({ ...item, orden: index + 1 }));

    setRows(withOrder);
    setDragId('');
    setDragOverId('');

    try {
      const updatedRows = await reorderOrganigrama(withOrder.map((item) => ({ id: item._id, orden: item.orden })));
      setRows(updatedRows || withOrder);
      toast.success('Orden actualizado');
      await loadAudit(auditMeta.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar el nuevo orden');
      await loadData();
    }
  };

  const startInlineEdit = (row) => {
    setInlineEditId(row._id);
    setInlinePuestosText(formatPuestos(row.puestos || []));
  };

  const cancelInlineEdit = () => {
    setInlineEditId('');
    setInlinePuestosText('');
  };

  const saveInlineEdit = async (row) => {
    setInlineSaving(true);
    try {
      const updated = await updateOrganigrama(row._id, { puestos: parsePuestos(inlinePuestosText) });
      setRows((prev) => prev.map((item) => (item._id === row._id ? { ...item, ...updated } : item)));
      toast.success('Puestos actualizados');
      cancelInlineEdit();
      await loadAudit(auditMeta.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar la edición rápida');
    } finally {
      setInlineSaving(false);
    }
  };

  const exportAsImage = async () => {
    try {
      if (!exportSectionRef.current) return;
      const canvas = await html2canvas(exportSectionRef.current, { scale: 2, backgroundColor: '#f5f7fb' });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'organigrama.png';
      link.click();
    } catch (error) {
      toast.error('No se pudo exportar la imagen del organigrama');
    }
  };

  const exportAsPdf = async () => {
    try {
      if (!exportSectionRef.current) return;
      const canvas = await html2canvas(exportSectionRef.current, { scale: 2, backgroundColor: '#f5f7fb' });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const imgWidth = pageWidth - 10;
      const ratio = canvas.height / canvas.width;
      const imgHeight = imgWidth * ratio;
      pdf.addImage(img, 'PNG', 5, 5, imgWidth, imgHeight);
      pdf.save('organigrama.pdf');
    } catch (error) {
      toast.error('No se pudo exportar el PDF del organigrama');
    }
  };

  const toggleCollapse = (nodeId) => {
    setCollapsedNodeIds((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const renderTreeNode = (node, depth = 0) => {
    const nodeId = String(node._id);
    const isCollapsed = !!collapsedNodeIds[nodeId];
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;

    return (
      <li key={`tree-${nodeId}`} className={styles.treeArea} style={{ marginLeft: depth * 8 }}>
        <div className={styles.treeNodeHeader}>
          {hasChildren && (
            <button className={styles.collapseBtn} type="button" onClick={() => toggleCollapse(nodeId)}>
              {isCollapsed ? '+' : '-'}
            </button>
          )}
          {!hasChildren && <span className={styles.collapseGhost} />}
          <strong>{node.area}</strong>
          <span>Jefe: {node.jefe}</span>
          {isAdmin && (
            <button className={styles.secondaryBtn} onClick={() => onEdit(node)}>
              Editar
            </button>
          )}
        </div>
        <div className={styles.treeNodeMeta}>
          <span>Subjefe: {node.subjefe || 'No asignado'}</span>
          <span>{node.activo ? 'Activo' : 'Inactivo'}</span>
        </div>
        {!!node.equipos?.length && <p className={styles.treeInfoLine}><strong>Equipos:</strong> {node.equipos.join(', ')}</p>}
        {!!node.puestos?.length && (
          <ul className={styles.treeSubList}>
            {node.puestos.map((puesto) => (
              <li key={`${nodeId}-${puesto.nombre}`}>
                {puesto.nombre}: {(puesto.personas || []).join(', ') || 'Sin asignar'}
              </li>
            ))}
          </ul>
        )}
        {hasChildren && !isCollapsed && (
          <ul className={styles.treeSubList}>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const availableParents = useMemo(() => rows.filter((row) => row._id !== editId), [rows, editId]);

  const auditLabel = (action) => {
    if (action === 'create') return 'Alta';
    if (action === 'update') return 'Actualización';
    if (action === 'delete') return 'Baja';
    if (action === 'reorder') return 'Reordenamiento';
    return action;
  };

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <h1>Organigrama Institucional</h1>
        <p>Estructura organizacional para un hospital o clínica, por áreas y rangos.</p>

        {usingLocalFallback && (
          <div className={styles.fallbackNote}>
            <p>Modo local: este organigrama se está mostrando desde el ejemplo embebido porque el endpoint no respondió.</p>
            <button className={styles.secondaryBtn} onClick={loadData} disabled={loading}>
              Reintentar conexión API
            </button>
          </div>
        )}

        <div className={styles.metricsRow}>
          <div className={styles.metricChip}><strong>{metrics.total}</strong><span>Áreas</span></div>
          <div className={styles.metricChip}><strong>{metrics.activos}</strong><span>Activas</span></div>
          <div className={styles.metricChip}><strong>{metrics.puestos}</strong><span>Puestos</span></div>
          <div className={styles.metricChip}><strong>{metrics.personas}</strong><span>Personas</span></div>
        </div>

        <div className={styles.controlsRow}>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por área, jefe, equipo, puesto o persona"
          />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
          <select
            className={styles.filterSelect}
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value="12">12 por página</option>
            <option value="24">24 por página</option>
            <option value="50">50 por página</option>
            <option value="100">100 por página</option>
          </select>
        </div>

        <div className={styles.toolsRow}>
          <div className={styles.viewSwitch}>
            <button
              className={`${styles.secondaryBtn} ${viewMode === 'cards' ? styles.activeMode : ''}`}
              onClick={() => setViewMode('cards')}
            >
              Vista tarjetas
            </button>
            <button
              className={`${styles.secondaryBtn} ${viewMode === 'tree' ? styles.activeMode : ''}`}
              onClick={() => setViewMode('tree')}
            >
              Vista árbol
            </button>
          </div>
          <div className={styles.exportActions}>
            <button className={styles.secondaryBtn} onClick={exportAsImage}>Exportar PNG</button>
            <button className={styles.secondaryBtn} onClick={exportAsPdf}>Exportar PDF</button>
          </div>
        </div>

        {isAdmin && !canReorder && (
          <p className={styles.reorderHint}>Para reordenar por arrastre, usa estado "Todos", sin búsqueda, página 1 y tamaño 100.</p>
        )}
      </section>

      <section ref={exportSectionRef} className={viewMode === 'tree' ? styles.treeSection : styles.grid}>
        {loading && <p>Cargando organigrama...</p>}
        {!loading && rows.length === 0 && (
          <p>No hay bloques cargados. {isAdmin ? 'Puedes crear uno nuevo o cargar el ejemplo.' : ''}</p>
        )}
        {!loading && viewMode === 'cards' && rows.map((bloque) => (
          <article
            key={bloque._id}
            className={`${styles.card} ${editId === bloque._id ? styles.cardEditing : ''} ${dragOverId === bloque._id ? styles.cardDragOver : ''}`}
            draggable={canReorder}
            onDragStart={() => onDragStart(bloque._id)}
            onDragOver={(e) => {
              if (!canReorder) return;
              e.preventDefault();
              setDragOverId(bloque._id);
            }}
            onDragLeave={() => setDragOverId('')}
            onDrop={(e) => {
              e.preventDefault();
              onDropReorder(bloque._id);
            }}
            onDragEnd={() => {
              setDragId('');
              setDragOverId('');
            }}
          >
            <h2>{bloque.area}</h2>
            <p><strong>Jefe:</strong> {bloque.jefe}</p>
            <p><strong>Subjefe:</strong> {bloque.subjefe}</p>
            <p><strong>Estado:</strong> {bloque.activo ? 'Activo' : 'Inactivo'}</p>
            <div>
              <strong>Áreas / Equipos:</strong>
              <ul>
                {(bloque.equipos || []).map((equipo) => (
                  <li key={equipo}>{equipo}</li>
                ))}
              </ul>
            </div>
            {!!bloque.puestos?.length && (
              <div>
                <strong>Puestos y personas:</strong>
                <ul>
                  {bloque.puestos.map((puesto) => (
                    <li key={puesto.nombre}>
                      <strong>{puesto.nombre}:</strong> {(puesto.personas || []).join(', ') || 'Sin asignar'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {isAdmin && inlineEditId === bloque._id && (
              <div className={styles.inlineEditor}>
                <label>
                  Edición rápida de puestos y personas
                  <textarea
                    value={inlinePuestosText}
                    onChange={(e) => setInlinePuestosText(e.target.value)}
                    placeholder={'Jefe de Área: Dra. Sofia Martinez\nSubjefe: Dr. Mateo Ruiz'}
                  />
                </label>
                <div className={styles.inlineEditorActions}>
                  <button className={styles.secondaryBtn} onClick={cancelInlineEdit} type="button">Cancelar</button>
                  <button className={styles.primaryBtn} onClick={() => saveInlineEdit(bloque)} type="button" disabled={inlineSaving}>
                    {inlineSaving ? 'Guardando...' : 'Guardar rápido'}
                  </button>
                </div>
              </div>
            )}
            {isAdmin && (
              <div className={styles.cardActions}>
                <button className={styles.secondaryBtn} onClick={() => onEdit(bloque)}>Editar</button>
                <button className={styles.secondaryBtn} onClick={() => startInlineEdit(bloque)}>Edición rápida</button>
                <button className={styles.dangerBtn} onClick={() => onDelete(bloque._id)}>Eliminar</button>
              </div>
            )}
          </article>
        ))}

        {!loading && viewMode === 'tree' && (
          <div className={styles.treeRoot}>
            <h3 className={styles.treeTitle}>Hospital / Clinica</h3>
            <ul className={styles.treeList}>
              {treeRows.map((bloque) => renderTreeNode(bloque))}
            </ul>
          </div>
        )}
      </section>

      {!loading && (meta.totalPages || 1) > 1 && (
        <div className={styles.paginationRow}>
          <button className={styles.secondaryBtn} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={(meta.page || currentPage) === 1}>
            Anterior
          </button>
          <span className={styles.paginationLabel}>Página {meta.page || currentPage} de {meta.totalPages || 1} ({meta.totalItems || rows.length} áreas)</span>
          <button className={styles.secondaryBtn} onClick={() => setCurrentPage((prev) => Math.min(meta.totalPages || 1, prev + 1))} disabled={(meta.page || currentPage) >= (meta.totalPages || 1)}>
            Siguiente
          </button>
        </div>
      )}

      {isAdmin && (
        <section className={styles.auditCard}>
          <div className={styles.auditHeader}>
            <h2>Auditoría de cambios</h2>
            <button className={styles.secondaryBtn} type="button" onClick={() => loadAudit(auditMeta.page || 1)} disabled={auditLoading}>
              {auditLoading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
          {auditRows.length === 0 && !auditLoading && <p>Sin movimientos auditados aún.</p>}
          {auditRows.length > 0 && (
            <ul className={styles.auditList}>
              {auditRows.map((item) => (
                <li key={item._id} className={styles.auditItem}>
                  <strong>{auditLabel(item.action)}</strong>
                  <span>Rol: {item.userRol || 'sin rol'}</span>
                  <span>{new Date(item.createdAt).toLocaleString('es-AR')}</span>
                </li>
              ))}
            </ul>
          )}
          {(auditMeta.totalPages || 1) > 1 && (
            <div className={styles.paginationRow}>
              <button className={styles.secondaryBtn} type="button" onClick={() => loadAudit(Math.max(1, (auditMeta.page || 1) - 1))} disabled={(auditMeta.page || 1) === 1 || auditLoading}>
                Anterior
              </button>
              <span className={styles.paginationLabel}>Página {auditMeta.page || 1} de {auditMeta.totalPages || 1}</span>
              <button className={styles.secondaryBtn} type="button" onClick={() => loadAudit(Math.min(auditMeta.totalPages || 1, (auditMeta.page || 1) + 1))} disabled={(auditMeta.page || 1) >= (auditMeta.totalPages || 1) || auditLoading}>
                Siguiente
              </button>
            </div>
          )}
        </section>
      )}

      {isAdmin && (
        <section className={styles.formCard} ref={formSectionRef}>
          <h2>{editId ? 'Editar bloque' : 'Nuevo bloque'}</h2>
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.grid2}>
              <label>
                Área
                <input
                  ref={areaInputRef}
                  value={form.area}
                  onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
                  required
                />
              </label>
              <label>
                Área padre
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
                >
                  <option value="">Sin padre (nivel raíz)</option>
                  {availableParents.map((item) => (
                    <option key={`parent-${item._id}`} value={item._id}>{item.area}</option>
                  ))}
                </select>
              </label>
              <label>
                Jefe
                <input
                  value={form.jefe}
                  onChange={(e) => setForm((prev) => ({ ...prev, jefe: e.target.value }))}
                  required
                />
              </label>
              <label>
                Subjefe
                <input
                  value={form.subjefe}
                  onChange={(e) => setForm((prev) => ({ ...prev, subjefe: e.target.value }))}
                />
              </label>
              <label>
                Orden
                <input
                  type="number"
                  value={form.orden}
                  onChange={(e) => setForm((prev) => ({ ...prev, orden: Number(e.target.value) }))}
                />
              </label>
            </div>

            <label>
              Equipos (separados por coma)
              <textarea
                value={form.equiposText}
                onChange={(e) => setForm((prev) => ({ ...prev, equiposText: e.target.value }))}
                placeholder="Ej: Guardia, Internacion, Farmacia"
              />
            </label>

            <label>
              Puestos y personas (una línea por puesto, formato: Puesto: Persona 1, Persona 2)
              <textarea
                value={form.puestosText}
                onChange={(e) => setForm((prev) => ({ ...prev, puestosText: e.target.value }))}
                placeholder={'Ej:\nJefe de Área: Dra. Sofia Martinez\nSubjefe: Dr. Mateo Ruiz'}
              />
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.checked }))}
              />
              <span>Activo</span>
            </label>

            <div className={styles.formActions}>
              {editId && (
                <button type="button" className={styles.secondaryBtn} onClick={resetForm}>
                  Cancelar edición
                </button>
              )}
              <button type="submit" className={styles.primaryBtn} disabled={saving}>
                {saving ? 'Guardando...' : editId ? 'Actualizar bloque' : 'Crear bloque'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
