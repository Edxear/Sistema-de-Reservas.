/**
 * Utilidades para exportar comentarios privados
 */

import { exportArrayToExcel } from './excelExport';

/**
 * Exporta comentarios a formato CSV
 */
export const exportarComentariosCSV = (comentarios, nombreMedico) => {
  if (!comentarios || comentarios.length === 0) {
    alert('No hay comentarios para exportar');
    return;
  }

  // Encabezados
  const encabezados = ['Fecha', 'Autor', 'Rol', 'Contenido'];
  
  // Datos
  const filas = comentarios.map(c => [
    new Date(c.fechaCreacion).toLocaleDateString(),
    c.autor?.nombre || 'N/A',
    c.tipoAutor,
    `"${c.contenido.replace(/"/g, '""')}"` // Escapar comillas
  ]);

  // Construir CSV
  const csv = [
    encabezados.join(','),
    ...filas.map(fila => fila.join(','))
  ].join('\n');

  // Descargar
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `comentarios_${nombreMedico}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportarComentariosExcel = (comentarios, nombreMedico) => {
  if (!comentarios || comentarios.length === 0) {
    alert('No hay comentarios para exportar');
    return;
  }

  const rows = comentarios.map((c) => ({
    Fecha: new Date(c.fechaCreacion).toLocaleDateString(),
    Hora: new Date(c.fechaCreacion).toLocaleTimeString(),
    Autor: c.autor?.nombre || 'N/A',
    Rol: c.tipoAutor || 'N/A',
    Contenido: c.contenido || '',
  }));

  exportArrayToExcel({
    rows,
    sheetName: 'Comentarios',
    fileName: `comentarios_${nombreMedico}_${new Date().toISOString().split('T')[0]}.xlsx`,
  });
};

/**
 * Exporta comentarios a formato PDF (usando biblioteca simple)
 */
export const exportarComentariosPDF = (comentarios, medico) => {
  if (!comentarios || comentarios.length === 0) {
    alert('No hay comentarios para exportar');
    return;
  }

  // Crear contenido HTML para el PDF
  const fechaActual = new Date().toLocaleDateString();
  const horaActual = new Date().toLocaleTimeString();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Comentarios Privados - ${medico.nombre}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
        .info-medico { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .info-medico p { margin: 5px 0; }
        .comentario { border-left: 4px solid #667eea; padding: 15px; margin-bottom: 15px; background: #f8f9fa; border-radius: 5px; }
        .header-comentario { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold; color: #333; }
        .autor { color: #667eea; }
        .rol { background: #667eea; color: white; padding: 2px 8px; border-radius: 3px; font-size: 0.9em; }
        .fecha { color: #999; }
        .contenido { color: #555; line-height: 1.6; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #999; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <h1>Comentarios Privados Médico</h1>
      
      <div class="info-medico">
        <p><strong>Médico:</strong> ${medico.nombre}</p>
        <p><strong>Especialidad:</strong> ${medico.especialidad || 'N/A'}</p>
        <p><strong>Matrícula:</strong> ${medico.matriculaProfesional || 'N/A'}</p>
      </div>

      ${comentarios.map(c => `
        <div class="comentario">
          <div class="header-comentario">
            <span>
              <span class="autor">${c.autor?.nombre || 'Anónimo'}</span>
              <span class="rol">${c.tipoAutor}</span>
            </span>
            <span class="fecha">${new Date(c.fechaCreacion).toLocaleDateString()} ${new Date(c.fechaCreacion).toLocaleTimeString()}</span>
          </div>
          <div class="contenido">${c.contenido.replace(/\n/g, '<br>')}</div>
        </div>
      `).join('')}

      <div class="footer">
        <p>Documento generado: ${fechaActual} a las ${horaActual}</p>
        <p>Total de comentarios: ${comentarios.length}</p>
      </div>
    </body>
    </html>
  `;

  // Abrir en nueva ventana e imprimir
  const ventana = window.open('', '_blank');
  ventana.document.write(html);
  ventana.document.close();
  
  // Esperar a que cargue y luego abrir el diálogo de impresión
  setTimeout(() => {
    ventana.print();
  }, 250);
};

/**
 * Exporta comentarios a formato JSON (descargable)
 */
export const exportarComentariosJSON = (comentarios, nombreMedico) => {
  if (!comentarios || comentarios.length === 0) {
    alert('No hay comentarios para exportar');
    return;
  }

  const datos = {
    medico: nombreMedico,
    fechaExportacion: new Date().toISOString(),
    totalComentarios: comentarios.length,
    comentarios: comentarios.map(c => ({
      fecha: new Date(c.fechaCreacion).toLocaleDateString(),
      hora: new Date(c.fechaCreacion).toLocaleTimeString(),
      autor: c.autor?.nombre || 'Anónimo',
      rol: c.tipoAutor,
      contenido: c.contenido
    }))
  };

  const json = JSON.stringify(datos, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `comentarios_${nombreMedico}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
