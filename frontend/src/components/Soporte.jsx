import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  createPrivateComment,
  deleteColleagueRating,
  deleteSupportUser,
  getColleagueRatingSummary,
  getPrivateComments,
  getSupportUsers,
  submitColleagueRating,
  updateSupportUser,
} from '../services/soporteService';
import { canAccessSupport, canViewPrivateColleagueComments } from '../utils/roles';
import styles from './Soporte.module.css';

export default function Soporte() {
  const { user } = useAuth();
  const role = user?.rol;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ average: 0, total: 0, ratings: [], myRating: null });
  const [stars, setStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const staffUsers = useMemo(() => users.filter((u) => u.rol !== 'paciente'), [users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getSupportUsers({ search });
      setUsers(Array.isArray(data) ? data : []);
      if (!targetUserId && Array.isArray(data) && data.length > 0) {
        const firstStaff = data.find((u) => u.rol !== 'paciente');
        if (firstStaff) {
          setTargetUserId(firstStaff._id);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar usuarios de soporte');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!targetUserId || !canViewPrivateColleagueComments(role)) return;
    try {
      const data = await getPrivateComments(targetUserId);
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudieron cargar comentarios privados');
    }
  };

  const loadRatingSummary = async () => {
    if (!targetUserId) return;
    try {
      const data = await getColleagueRatingSummary(targetUserId);
      setRatingSummary({
        average: data?.average || 0,
        total: data?.total || 0,
        ratings: Array.isArray(data?.ratings) ? data.ratings : [],
        myRating: data?.myRating || null,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar valoracion del colega');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadUsers();
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    loadComments();
    loadRatingSummary();
  }, [targetUserId]);

  useEffect(() => {
    if (!ratingSummary?.myRating) return;
    setStars(ratingSummary.myRating.stars || 5);
    setRatingComment(ratingSummary.myRating.comentario || '');
  }, [ratingSummary?.myRating?._id]);

  if (!canAccessSupport(role)) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h2>Soporte interno</h2>
          <p>No tienes permisos para ingresar a esta area.</p>
        </div>
      </div>
    );
  }

  const targetUser = users.find((u) => u._id === targetUserId);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Esta accion eliminara el usuario seleccionado. Deseas continuar?')) {
      return;
    }
    try {
      await deleteSupportUser(id);
      toast.success('Usuario eliminado');
      await loadUsers();
      if (targetUserId === id) {
        setTargetUserId('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar usuario');
    }
  };

  const handleRoleChange = async (id, nextRole) => {
    try {
      await updateSupportUser(id, { rol: nextRole });
      toast.success('Rol actualizado');
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar rol');
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!targetUserId || !commentText.trim()) return;
    try {
      await createPrivateComment(targetUserId, commentText);
      setCommentText('');
      toast.success('Comentario privado enviado');
      await loadComments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar comentario');
    }
  };

  const handleRating = async (e) => {
    e.preventDefault();
    if (!targetUserId) return;
    try {
      await submitColleagueRating(targetUserId, { stars, comentario: ratingComment });
      toast.success('Valoracion guardada');
      await loadRatingSummary();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar valoracion');
    }
  };

  const handleDeleteRating = async (ratingId) => {
    try {
      await deleteColleagueRating(ratingId);
      toast.success('Valoracion eliminada');
      await loadRatingSummary();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar valoracion');
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1>Area de Soporte</h1>
        <p>Gestion interna de usuarios, comentarios entre colegas y valoraciones de calidad de trabajo.</p>
      </section>

      <section className={styles.card}>
        <h2>Gestion de Usuarios</h2>
        <input
          className={styles.input}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o telefono"
        />

        {loading ? <p>Cargando usuarios...</p> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Telefono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className={u.esSuperAdminPrincipal ? styles.rowPrincipal : ''}>
                    <td>{u.nombre}{u.esSuperAdminPrincipal ? ' (Principal)' : ''}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className={styles.select}
                        value={u.rol}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      >
                        <option value="paciente">paciente</option>
                        <option value="secretaria">secretaria</option>
                        <option value="enfermero">enfermero</option>
                        <option value="medico">medico</option>
                        <option value="admin">admin</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    </td>
                    <td>{u.telefono || '-'}</td>
                    <td>
                      <button className={styles.dangerBtn} onClick={() => handleDeleteUser(u._id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2>Colega objetivo</h2>
        <select className={styles.select} value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
          <option value="">Seleccionar colega</option>
          {staffUsers.map((u) => (
            <option key={u._id} value={u._id}>{u.nombre} - {u.rol}</option>
          ))}
        </select>
        {targetUser && <p>Trabajando sobre: <strong>{targetUser.nombre}</strong> ({targetUser.rol})</p>}
      </section>

      <section className={styles.grid2}>
        <article className={styles.card}>
          <h3>Comentarios internos entre colegas</h3>
          <p>Visibilidad restringida: solo administradores y admin principal.</p>

          <form onSubmit={handleCreateComment} className={styles.formCol}>
            <textarea
              className={styles.textarea}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario interno sobre este colega"
            />
            <button className={styles.primaryBtn} type="submit">Guardar comentario</button>
          </form>

          <div className={styles.listWrap}>
            {comments.length === 0 ? <p>Sin comentarios.</p> : comments.map((c) => (
              <div key={c._id} className={styles.item}>
                <div className={styles.itemTitle}>{c.autor?.nombre || 'Autor'} ({c.autor?.rol || '-'})</div>
                <div>{c.contenido}</div>
                <small>{new Date(c.fechaCreacion).toLocaleString()}</small>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.card}>
          <h3>Valoracion por estrellas</h3>
          <p>Califica la calidad de trabajo del colega seleccionado.</p>
          <p>Promedio actual: <strong>{ratingSummary.average}</strong> ({ratingSummary.total} voto(s))</p>

          <form onSubmit={handleRating} className={styles.formCol}>
            <select className={styles.select} value={stars} onChange={(e) => setStars(Number(e.target.value))}>
              <option value={5}>5 estrellas</option>
              <option value={4}>4 estrellas</option>
              <option value={3}>3 estrellas</option>
              <option value={2}>2 estrellas</option>
              <option value={1}>1 estrella</option>
            </select>
            <textarea
              className={styles.textarea}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Comentario opcional de evaluacion"
            />
            <button className={styles.primaryBtn} type="submit">Guardar valoracion</button>
          </form>

          <div className={styles.listWrap}>
            {Array.isArray(ratingSummary.ratings) && ratingSummary.ratings.length > 0 ? ratingSummary.ratings.map((r) => (
              <div key={r._id} className={styles.item}>
                <div className={styles.itemTitle}>{r.authorUser?.nombre || 'Autor'} - {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
                <div>{r.comentario || 'Sin comentario'}</div>
                <div className={styles.rowEnd}>
                  <small>{new Date(r.createdAt).toLocaleString()}</small>
                  <button className={styles.linkBtn} onClick={() => handleDeleteRating(r._id)}>Eliminar</button>
                </div>
              </div>
            )) : <p>No hay valoraciones aún.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}
