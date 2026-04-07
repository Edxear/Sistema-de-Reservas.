import React, { useMemo, useState } from 'react';
import styles from './Enfermeria.module.css';

const InfoBtn = ({ texto }) => (
  <button
    type="button"
    onClick={() => alert(texto)}
    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', opacity: 0.7 }}
    title="Más información"
  >
    ℹ️
  </button>
);

// ──────────────────────────────────────────────────────
// BASE DE CONOCIMIENTO COMPLETA
// ──────────────────────────────────────────────────────
const CONTENIDOS = [
  // ─── PROCEDIMIENTOS ───
  {
    id: 'p1', categoria: 'procedimiento', icono: '🩺',
    titulo: 'Canalización de vía venosa periférica',
    resumen: 'Inserción de catéter IV para administración de fluidos y medicación.',
    pasos: [
      'Lavarse las manos. Preparar material: catéter, compresor, torunda con antiséptico, apósito, guantes.',
      'Identificar positivamente al paciente (pulsera + verbalmente).',
      'Elegir vena: antecubital > antebrazo > dorso de mano. Evitar zonas con hematomas o infección.',
      'Colocar compresor 5-10 cm por encima del sitio de punción.',
      'Desinfectar la piel con movimiento circular de adentro hacia afuera. Dejar secar.',
      'Insertar catéter con bisel arriba, ángulo 15-30°. Al refluir sangre, avanzar 2 mm y retirar fiador.',
      'Avanzar el catéter, retirar fiador completamente, soltar compresor.',
      'Conectar llave de 3 vías o tapón, fijar con apósito transparente.',
      'Registrar: fecha, hora, calibre del catéter, sitio de inserción, nombre del enfermero.',
    ],
    alertas: [
      '⚠ Máximo 72-96h por catéter (rotar sitio)',
      '⚠ Observar signos de flebitis: enrojecimiento, calor, dolor, induración',
      '⚠ Calibres menores (20-22G) para medicación. Grandes (14-16G) para emergencias.',
    ],
  },
  {
    id: 'p2', categoria: 'procedimiento', icono: '🩺',
    titulo: 'Sondaje vesical',
    resumen: 'Inserción de sonda uretral para drenaje de orina o control de diuresis.',
    pasos: [
      'Verificar prescripción médica. Explicar procedimiento al paciente.',
      'Material: sonda Foley (talla adecuada: mujer 14-16F, hombre 16-18F), bolsa colectora, jeringa con agua destilada, lubricante estéril, campo estéril.',
      'Paciente en posición ginecológica (mujer) o decúbito supino con piernas extendidas (hombre).',
      'Colocarse guantes estériles. Limpiar meato con antiséptico (mujer: de arriba hacia abajo; hombre: circular desde el meato).',
      'Lubricar sonda. Introducir suavemente: mujer ~5-7cm, hombre ~15-20cm hasta ver reflujo de orina.',
      'Inflar balón con 5-10 mL de agua destilada (según fabricante). Tirar suavemente para comprobar anclaje.',
      'Conectar a bolsa colectora. Fijar sonda en cara interna del muslo con cinta.',
      'Registrar: fecha, hora, talla de sonda, cantidad de orina al inicio, aspecto.',
    ],
    alertas: [
      '⚠ Técnica estéril en todo momento para evitar ITU asociada a catéter',
      '⚠ Mantener bolsa siempre por debajo del nivel de la vejiga',
      '⚠ Revisar indicación diariamente: retirar lo antes posible',
      '⚠ Si resistencia al insertar: NO forzar. Avisar al médico.',
    ],
  },
  {
    id: 'p3', categoria: 'procedimiento', icono: '🩺',
    titulo: 'Administración de medicación IV',
    resumen: 'Protocolo de seguridad para administrar medicamentos por vía intravenosa.',
    pasos: [
      'Verificar los 5 CORRECTOS: paciente correcto, medicamento correcto, dosis correcta, vía correcta, hora correcta.',
      'Leer la prescripción en la historia sin abreviaturas propias.',
      'Preparar en zona limpia y bien iluminada. No preparar más de un medicamento a la vez.',
      'Comprobar caducidad del medicamento y la integridad del envase.',
      'Lavarse las manos y ponerse guantes.',
      'Identificar positivamente al paciente ANTES de administrar.',
      'Verificar permeabilidad de la vía: purgar con SF 0.9% antes y después.',
      'Administrar a la velocidad prescrita (no "acelerar" sin orden médica).',
      'Observar al paciente los primeros 5 minutos buscando signos de reacción adversa.',
      'Registrar en la hoja de medicación: hora real de administración, firma.',
    ],
    alertas: [
      '⚠ DOBLE CHEQUEO obligatorio para: insulina, heparina, opioides, electrolitos concentrados (KCl, NaCl 20%)',
      '⚠ Nunca dejar medicación preparada sin etiquetar',
      '⚠ Ante duda: consultar antes de administrar. Nunca adivinar.',
      '⚠ Reacción alérgica: detener infusión, mantener vía con SF, avisar médico urgente',
    ],
  },
  {
    id: 'p4', categoria: 'procedimiento', icono: '🩺',
    titulo: 'Cura de herida simple',
    resumen: 'Limpieza y vendaje de heridas sin signos de infección.',
    pasos: [
      'Preparar material: SF 0.9%, gasas estériles, guantes, antiséptico si indicado, apósito adecuado.',
      'Retirar apósito antiguo con guantes sucios. Evaluar herida: tamaño, aspecto, bordes, secreción.',
      'Cambiar guantes (guantes limpios o estériles según protocolo del servicio).',
      'Limpiar la herida con SF 0.9% desde el centro hacia la periferia, sin frotar.',
      'Si hay esfacelos o tejido necrótico: valorar desbridamiento (según protocolo).',
      'Aplicar apósito adecuado según tipo de herida (hidrocoloide, espuma, alginato…).',
      'Fijar con cinta si no es autoadhesivo.',
      'Registrar: aspecto de la herida, tamaño, exudado, apósito utilizado, fecha próxima cura.',
    ],
    alertas: [
      '⚠ Signos de infección: calor, enrojecimiento, edema, exudado purulento, fiebre → avisar médico',
      '⚠ No usar agua oxigenada ni Betadine® en heridas crónicas (inhiben cicatrización)',
      '⚠ Fotografiar evolución en heridas crónicas para comparar',
    ],
  },
  {
    id: 'p5', categoria: 'procedimiento', icono: '🩺',
    titulo: 'Pase de guardia seguro',
    resumen: 'Transferencia estructurada de información entre turnos para garantizar continuidad asistencial.',
    pasos: [
      'Realizarlo presencialmente junto a la cama del paciente siempre que sea posible.',
      'Usar formato SBAR: Situación → Background (antecedentes) → Análisis → Recomendación.',
      'Comunicar: diagnóstico, estado actual, tratamientos en curso, vías y accesos.',
      'Alertar sobre: alergias conocidas, riesgo de caídas, riesgo de UPP, restricciones de dieta.',
      'Mencionar pendientes del turno: analíticas, pruebas, medicación próxima.',
      'Confirmar que quien recibe ha entendido. Resolver dudas antes de retirarse.',
      'Firmar la hoja de pase de guardia.',
    ],
    alertas: [
      '⚠ Nunca hacer el pase por teléfono si hay pacientes críticos o inestables',
      '⚠ Actualizar hoja de enfermería antes del pase',
    ],
  },

  // ─── ESCALAS CLÍNICAS ───
  {
    id: 'e1', categoria: 'escala', icono: '📊',
    titulo: 'Escala NEWS (National Early Warning Score)',
    resumen: 'Detecta deterioro clínico precoz. Suma puntos de 6 parámetros vitales.',
    pasos: [
      'Frecuencia respiratoria: ≤8 o ≥25 = 3pts | 9-11 = 1pt | 21-24 = 2pts | 12-20 = 0pts',
      'Saturación O₂: ≤91% = 3pts | 92-93% = 2pts | 94-95% = 1pt | ≥96% = 0pts',
      'Temperatura: ≤35° o ≥39.1° = 2pts | 35.1-36° o 38.1-39° = 1pt | 36-38° = 0pts',
      'Presión arterial sistólica: ≤90 o ≥220 = 3pts | 91-100 = 2pts | 101-110 = 1pt | 111-219 = 0pts',
      'Frecuencia cardíaca: ≤40 o ≥131 = 3pts | 41-50 o 111-130 = 1pt | 51-90 = 0pts | 91-110 o ≥131 = …',
      'Nivel de conciencia: AVPU: A=0 V=3 P=3 U=3',
      'Suplemento de O₂: Sí = 2pts | No = 0pts',
    ],
    alertas: [
      'NEWS 0-4: bajo riesgo → monitoreo rutinario',
      'NEWS 5-6 (o ≥3 en un parámetro): riesgo medio → aumentar frecuencia de controles, avisar médico',
      'NEWS ≥7: riesgo alto → activar equipo de respuesta rápida / UCI',
    ],
  },
  {
    id: 'e2', categoria: 'escala', icono: '📊',
    titulo: 'Escala de dolor EVA / NRS',
    resumen: 'Cuantificar el dolor del paciente para ajustar analgesia.',
    pasos: [
      'Preguntar: "Del 0 al 10, ¿cuánto le duele? Donde 0 es sin dolor y 10 es el peor dolor imaginable."',
      '0: sin dolor',
      '1-3: dolor leve → analgesia de primer escalón (paracetamol, AINE)',
      '4-6: dolor moderado → valorar combinación o escalón 2 (tramadol)',
      '7-10: dolor severo → escalón 3 (opioides). Avisar al médico si EVA ≥7',
    ],
    alertas: [
      '⚠ En pacientes sedados o con deterioro cognitivo, usar escala conductual (CPOT, FLACC)',
      '⚠ Reevaluar a los 30 min tras cada intervención analgésica',
      '⚠ Registrar SIEMPRE la puntuación, no solo decir "refiere dolor"',
    ],
  },
  {
    id: 'e3', categoria: 'escala', icono: '📊',
    titulo: 'Escala de Barthel (dependencia funcional)',
    resumen: 'Evalúa la independencia del paciente en actividades básicas (0-100 puntos).',
    pasos: [
      'Alimentación: 10 (independiente) / 5 (ayuda) / 0 (dependiente)',
      'Baño: 5 (independiente) / 0 (dependiente)',
      'Aseo personal: 5 (independiente) / 0 (necesita ayuda)',
      'Vestido: 10 (independiente) / 5 (ayuda) / 0 (dependiente)',
      'Control intestinal: 10 (continente) / 5 (accidente ocasional) / 0 (incontinente)',
      'Control vesical: 10 (continente) / 5 (accidente ocasional) / 0 (incontinente)',
      'Uso del retrete: 10 / 5 / 0',
      'Traslado cama-sillón: 15 / 10 / 5 / 0',
      'Deambulación: 15 (>50m) / 10 (con ayuda) / 5 (silla de ruedas) / 0',
      'Escaleras: 10 / 5 / 0',
    ],
    alertas: [
      '100: independiente | 60-99: dependencia leve | 40-59: dependencia moderada | <40: dependencia grave | 0: dependencia total',
      '⚠ Documentar al ingreso para comparar al alta',
      '⚠ Cambia el nivel de cuidados de enfermería necesarios',
    ],
  },
  {
    id: 'e4', categoria: 'escala', icono: '📊',
    titulo: 'Escala de riesgo de caídas (Morse o Downton)',
    resumen: 'Identifica pacientes con alto riesgo de caída para implementar medidas preventivas.',
    pasos: [
      'Historial de caídas previas: No=0 / Sí=25',
      'Diagnóstico secundario: No=0 / Sí=15',
      'Soporte de deambulación: Sin soporte=0 / Muletas-bastón=15 / Muebles=30',
      'Vía IV/heparina: No=0 / Sí=20',
      'Marcha/transferencia: Normal=0 / Débil o deteriorada=10 / Alterada=20',
      'Estado mental: Orientado=0 / Confuso (sobreestima capacidades)=15',
    ],
    alertas: [
      '<25: bajo riesgo | 25-44: riesgo moderado | ≥45: alto riesgo',
      '⚠ Riesgo alto: barandillas arriba, timbre al alcance, calzado antideslizante, acompañar al baño',
      '⚠ Re-evaluar con cada cambio de estado clínico (sedación, nueva medicación, cateterismo…)',
    ],
  },

  // ─── PROTOCOLOS DE EMERGENCIA ───
  {
    id: 'em1', categoria: 'emergencia', icono: '🚨',
    titulo: 'Bundle de Sepsis (1 hora)',
    resumen: 'Actuación urgente ante sospecha de sepsis. Cada minuto cuenta.',
    pasos: [
      '① RECONOCER: Fiebre/hipotermia + FC>90 + FR>20 + origen infeccioso probable → sospecha de sepsis.',
      '② AVISAR al médico INMEDIATAMENTE. No esperar resultados para avisar.',
      '③ HEMOCULTIVOS x2 (de venas distintas) ANTES de dar antibiótico.',
      '④ LACTATO sérico (identificar hipoperfusión: >2 mmol/L es preocupante, >4 = shock).',
      '⑤ ANTIBIÓTICO IV de amplio espectro según protocolo del servicio, en la 1ª hora.',
      '⑥ FLUIDOS: si hipotensión (TAS<90) o lactato>4: 30 mL/kg de cristaloide IV en ≤3h.',
      '⑦ MONITORIZAR: diuresis horaria (>0.5 mL/kg/h), TA cada 15 min, SatO₂ continua.',
    ],
    alertas: [
      '🔴 PRIORIDAD MÁXIMA: la mortalidad aumenta ~7% por cada hora de retraso en antibiótico',
      '⚠ Activar código sepsis del centro si está disponible',
      '⚠ Preparar material de acceso vascular de gran calibre (14-16G)',
    ],
  },
  {
    id: 'em2', categoria: 'emergencia', icono: '🚨',
    titulo: 'Parada cardiorrespiratoria (PCR) — RCP básica',
    resumen: 'Actuación inmediata ante un paciente que no responde y no respira.',
    pasos: [
      '① SEGURIDAD: asegurar entorno. No acercarse si hay riesgo eléctrico u otro.',
      '② COMPROBAR RESPUESTA: sacudir hombros y gritar "¿Está usted bien?".',
      '③ PEDIR AYUDA: gritar, pulsar timbre emergencias. Pedir DESFIBRILADOR (DEA).',
      '④ APERTURA DE VÍA AÉREA: extensión de cabeza, elevación del mentón.',
      '⑤ COMPROBAR RESPIRACIÓN: ver, oír, sentir durante máx. 10 segundos.',
      '⑥ Si no respira normalmente: iniciar RCP → 30 compresiones + 2 ventilaciones.',
      'Compresiones: centro del pecho, 5-6 cm de profundidad, 100-120/min. Brazos rectos.',
      '⑦ Al llegar el DEA: encender, pegar parches, seguir instrucciones de voz.',
      '⑧ RCP continua hasta llegada del equipo médico o recuperación del paciente.',
    ],
    alertas: [
      '🔴 No abandonar las compresiones salvo para desfibrilar o indicación médica',
      '⚠ Turnarse con otro compañero cada 2 minutos para no perder calidad',
      '⚠ Registrar: hora exacta de inicio RCP, hora del primer estado de conciencia',
    ],
  },
  {
    id: 'em3', categoria: 'emergencia', icono: '🚨',
    titulo: 'Crisis asmática / broncoespasmo grave',
    resumen: 'Actuación ante disnea brusca severa con sibilancias.',
    pasos: [
      '① Sentar al paciente en posición de tripode (inclinado hacia adelante, apoyado en brazos).',
      '② Medir SatO₂. Si <92%: O₂ inmediato en mascarilla (24-28% o según indicación médica).',
      '③ Avisar al médico URGENTE.',
      '④ Administrar broncodilatador de rescate (salbutamol) según prescripción: MDI con cámara o nebulización.',
      '⑤ Monitorizar: SatO₂ continua, FR, FC, nivel de conciencia.',
      '⑥ Si no mejora en 15-20 min o empeora: preparar acceso IV para corticoides IV.',
      '⑦ Criterios de intubación urgente: silencio ausculatorio, confusión, agotamiento, PCR.',
    ],
    alertas: [
      '🔴 El "silencio ausculatorio" (ausencia de sibilancias) NO es mejoría: puede indicar estado crítico',
      '⚠ Evitar sedación antes de asegurar vía aérea en crisis grave',
    ],
  },
  {
    id: 'em4', categoria: 'emergencia', icono: '🚨',
    titulo: 'Hipoglucemia grave (glucemia < 54 mg/dL)',
    resumen: 'Corrección urgente de glucemia baja con síntomas neurológicos.',
    pasos: [
      '① Si paciente consciente y puede tragar: 15-20g hidratos de absorción rápida (glucosa en gel, zumo, 3 sobres de azúcar).',
      '② Repetir glucemia a los 15 min. Si sigue <70: repetir dosis.',
      '③ Si paciente inconsciente/no puede tragar: NO administrar nada oral.',
      '④ Avisar al médico URGENTE.',
      '⑤ Glucagón IM/SC 1 mg (si disponible y sin acceso IV) → efecto en 10-15 min.',
      '⑥ Si acceso IV: glucosa al 20-50%: 25-50 mL IV en 5 min (según prescripción).',
      '⑦ Monitorizar glucemia cada 15 min hasta estabilizar (>100 mg/dL durante 1h).',
      '⑧ Buscar causa: ingesta insuficiente, error de dosis, ejercicio no previsto…',
    ],
    alertas: [
      '⚠ No dejar solo al paciente hasta recuperación completa del nivel de conciencia',
      '⚠ Registrar: hora, valor de glucemia, tratamiento administrado, respuesta',
      '⚠ Re-evaluar pauta de insulina con el médico tras episodio',
    ],
  },

  // ─── MEDICACIÓN FRECUENTE ───
  {
    id: 'm1', categoria: 'medicacion', icono: '💊',
    titulo: 'Insulina — Administración segura',
    resumen: 'Medicamento de alto riesgo. Requiere doble chequeo obligatorio.',
    pasos: [
      'DOBLE CHEQUEO: dos enfermeros verifican dosis y tipo de insulina antes de administrar.',
      'Verificar glucemia ANTES de administrar. Si <70: no administrar, avisar médico.',
      'Tipos frecuentes: Rápida/Regular (Actrapid) actúa en 30 min. NPH en 1-2h. Análogos (Novorapid, Humalog) actúan en 10-15 min.',
      'Administrar SC: pellizcar tejido, ángulo 45-90° según corpulencia del paciente.',
      'Rotar zonas: abdomen (más rápida absorción) > muslo > brazo > glúteo.',
      'Cambiar aguja en cada inyección. Agujas para pluma: 4-6mm recomendado.',
      'Si insulina en perfusión IV: usar únicamente insulina regular. Bomba de infusión.',
      'Controlar glucemia 1-2h post-dosis.',
    ],
    alertas: [
      '🔴 ALTO RIESGO: errores de insulina son causa frecuente de hipoglucemia grave',
      '⚠ Conservar en nevera (2-8°C). Una vez abierta: temperatura ambiente hasta 28 días',
      '⚠ Nunca mezclar insulinas en jeringa sin orden específica',
    ],
  },
  {
    id: 'm2', categoria: 'medicacion', icono: '💊',
    titulo: 'Heparina — Anticoagulación',
    resumen: 'Prevención y tratamiento antitrombótico. Alto riesgo de sangrado.',
    pasos: [
      'HBPM profiláctica (ej. enoxaparina 40mg): SC, generalmente una vez al día.',
      'Administrar SC: abdomen, alternando lados. No frotar tras inyección.',
      'No mezclar con otros medicamentos en la misma jeringa.',
      'Heparina sódica IV: requiere bomba de infusión y control con APTT.',
      'Antes de administrar: verificar que no hay sangrado activo, plaquetas>100.000, APTT.',
      'Monitorizar signos de sangrado: hematomas, melenas, hematuria, sangrado del punto de punción.',
    ],
    alertas: [
      '⚠ Antídoto de heparina sódica: sulfato de protamina (solo con indicación médica)',
      '⚠ Antídoto de HBPM: protamina parcialmente efectiva (consultar médico)',
      '⚠ Suspender si plaquetas <50.000 (revisar con médico urgente)',
    ],
  },
  {
    id: 'm3', categoria: 'medicacion', icono: '💊',
    titulo: 'Potasio IV (KCl) — Electrolito de alto riesgo',
    resumen: 'El potasio IV concentrado puede ser letal si se administra rápido o sin diluir.',
    pasos: [
      'NUNCA administrar KCl concentrado IV directo sin diluir.',
      'Diluir siempre en suero (mínimo 100 mL por cada 10 mEq).',
      'Velocidad máxima: 10 mEq/hora en vía periférica. 20 mEq/h solo en vía central con monitorización.',
      'Administrar con bomba de infusión. Nunca en libre caída.',
      'Monitorizar ECG si reponer >20 mEq/h.',
      'Verificar analítica de control a las 2-4h si reposición importante.',
    ],
    alertas: [
      '🔴 ALTO RIESGO: potasio IV rápido causa arritmias ventriculares y parada cardíaca',
      '⚠ La vía debe ser periférica solo para concentraciones ≤40 mEq/L; más concentrado → vía central',
      '⚠ Doble verificación obligatoria antes de preparar',
    ],
  },
  {
    id: 'm4', categoria: 'medicacion', icono: '💊',
    titulo: 'Opioides — Morfina, Fentanilo, Tramadol',
    resumen: 'Analgésicos potentes con riesgo de depresión respiratoria.',
    pasos: [
      'DOBLE CHEQUEO en morfina y fentanilo IV.',
      'Morfina IV: titular lentamente (2-4 mg IV cada 5-15 min hasta efecto en dolor agudo).',
      'Fentanilo transdérmico (parches): inicio de efecto 12-24h. Cambiar cada 72h.',
      'Tramadol IV: diluir en 100 mL SF, infundir lento (30 min). Riesgo de convulsiones si rápido.',
      'Monitorizar tras administración IV: FR, SatO₂, nivel de conciencia, puntuación RASS.',
      'Tener NALOXONA disponible como antídoto (0.4 mg IV, repetir cada 2-3 min si necesario).',
    ],
    alertas: [
      '🔴 FR < 8-10 rpm tras opioide → sospecha de depresión respiratoria → naloxona + avisar médico',
      '⚠ Constipación: iniciar laxante profiláctico desde el primer día de tratamiento con opioides',
      '⚠ Sedación y riesgo de caídas: especial vigilancia en adultos mayores',
    ],
  },

  // ─── CUIDADOS ESPECÍFICOS ───
  {
    id: 'c1', categoria: 'cuidados', icono: '👋',
    titulo: 'Prevención de úlceras por presión (UPP)',
    resumen: 'Protocolo de prevención para pacientes con riesgo en la escala de Braden.',
    pasos: [
      'Valorar Braden al ingreso y con cada cambio de estado. Si <14: iniciar protocolo.',
      'Cambios posturales: cada 2 horas en cama (documentar posición y hora).',
      'Posiciones alternadas: decúbito supino → lateral izquierdo 30° → lateral derecho 30°.',
      'NUNCA posición 90° lateral (aumenta presión sobre trocánter).',
      'Aplicar ácidos grasos hiperoxigenados (AGHO) en zonas de riesgo: talones, sacro, occipucio.',
      'Colchón antiescaras o superficie especial si Braden <14.',
      'Elevar talones de la cama con almohadas bajo las pantorrillas (no bajo el talón).',
      'Mantener ropa de cama sin arrugas, seca y limpia.',
      'Revisión de piel completa en cada higiene: registrar cualquier zona enrojecida.',
      'Si eritema que no desaparece al presionar: UPP estadio 1 → intensificar medidas y avisar.',
    ],
    alertas: [
      '⚠ El 95% de las UPP son PREVENIBLES con un protocolo correcto',
      '⚠ Las zonas de más riesgo son: sacro, talones, codos, occipucio, orejas',
      '⚠ Fotografiar y registrar cualquier lesión nueva con fecha y hora',
    ],
  },
  {
    id: 'c2', categoria: 'cuidados', icono: '👋',
    titulo: 'Prevención de infecciones asociadas al catéter (IXAC)',
    resumen: 'Medidas para reducir las infecciones por vía vascular.',
    pasos: [
      'Lavado de manos CON agua y jabón o gel alcohólico ANTES de manipular cualquier acceso vascular.',
      'Técnica aséptica estricta en inserción: mascarilla, gorro, bata, guantes estériles, campo estéril.',
      'Desinfectar llave de tres vías o hub con torunda de alcohol 70° durante 15 segundos y dejar secar.',
      'Revisar el apósito del catéter diariamente: si húmedo, despegado o con sangre → cambiar.',
      'Registrar fecha de inserción y cambiar catéter periférico cada 72-96h.',
      'Revisar diariamente la indicación: "¿Sigue necesitando este catéter?" → si no: retirar.',
      'Cultivo del catéter si fiebre sin foco claro.',
    ],
    alertas: [
      '⚠ Signos de infección local: eritema, calor, exudado, dolor → retirar catéter, cultivo del extremo',
      '⚠ Fiebre + escalofríos + catéter central → hemocultivos urgentes + avisar médico',
    ],
  },
  {
    id: 'c3', categoria: 'cuidados', icono: '👋',
    titulo: 'Higiene del paciente encamado',
    resumen: 'Aseo completo para mantener integridad cutánea y confort del paciente.',
    pasos: [
      'Comunicar al paciente lo que se va a hacer. Preservar intimidad con biombo o cortina.',
      'Preparar agua tibia (37-38°C), jabón neutro, esponja, toallas secas, ropa limpia.',
      'Lavado: cara → cuello → pecho → brazos → abdomen → genitales → piernas → espalda.',
      'Genitales: de adelante hacia atrás en la mujer. En hombre con sonda: limpiar desde el meato hacia afuera.',
      'Secar bien especialmente pliegues: axilas, inglés, debajo de mamas, entre los dedos.',
      'Aprovechar el aseo para: revisión completa de piel, aplicar crema hidratante, cambiar sábanas.',
      'Higiene bucal: aunque el paciente esté en ayunas, realizarla 2-3 veces al día.',
      'Si ventilación mecánica: higiene oral con clorhexidina 0.12% según protocolo.',
    ],
    alertas: [
      '⚠ No fregar la piel: el frotado agresivo daña la barrera cutánea',
      '⚠ Usar agua demasiado caliente puede producir quemaduras (especial cuidado en ancianos y diabéticos)',
    ],
  },
];

const CATEGORIAS = {
  procedimiento: { label: 'Procedimientos', color: '#dbeafe', colorBorde: '#3b82f6', icono: '🩺' },
  escala: { label: 'Escalas clínicas', color: '#d1fae5', colorBorde: '#10b981', icono: '📊' },
  emergencia: { label: 'Emergencias', color: '#fee2e2', colorBorde: '#ef4444', icono: '🚨' },
  medicacion: { label: 'Medicación', color: '#fef3c7', colorBorde: '#f59e0b', icono: '💊' },
  cuidados: { label: 'Cuidados específicos', color: '#ede9fe', colorBorde: '#8b5cf6', icono: '👋' },
};

export default function BaseConocimiento() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [itemAbierto, setItemAbierto] = useState(null);

  const contenidosData = CONTENIDOS;

  const resultados = useMemo(() => {
    return contenidosData.filter((item) => {
      const coincideCategoria = categoriaActiva === 'todas' || item.categoria === categoriaActiva;
      const textoBusqueda = busqueda.trim().toLowerCase();
      const coincideBusqueda = !textoBusqueda
        || item.titulo.toLowerCase().includes(textoBusqueda)
        || item.resumen.toLowerCase().includes(textoBusqueda)
        || item.pasos.some((p) => p.toLowerCase().includes(textoBusqueda));
      return coincideCategoria && coincideBusqueda;
    });
  }, [busqueda, categoriaActiva, contenidosData]);

  const toggleItem = (id) => setItemAbierto((prev) => (prev === id ? null : id));

  return (
    <div>
      {/* HEADER */}
      <section className={styles.card} style={{ borderLeft: '4px solid #f59e0b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>📚 Base de Conocimiento</h2>
            <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
              Procedimientos, escalas, protocolos de emergencia y guías de medicación. Siempre disponible, sin internet.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <InfoBtn texto={'Base de Conocimiento:\n\nAquí encontrarás guías paso a paso para los procedimientos y situaciones más frecuentes en enfermería.\n\n• Busca por palabras clave (ej: "catéter", "sepsis")\n• Filtra por categoría con los botones de colores\n• Haz clic en cualquier tarjeta para ver los pasos detallados\n\nEsta información es orientativa. Ante dudas, siempre consulta con tu supervisor o el médico tratante.'} />
          </div>
        </div>
      </section>

      {/* BUSCADOR + FILTROS */}
      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <input
          type="text"
          className={styles.select}
          placeholder="🔍 Buscar procedimiento, escala, medicamento... (ej: insulina, sepsis, caídas)"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setItemAbierto(null); }}
          style={{ width: '100%', marginBottom: '1rem', fontSize: '1rem' }}
        />

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setCategoriaActiva('todas')}
            style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', backgroundColor: categoriaActiva === 'todas' ? '#374151' : '#e5e7eb', color: categoriaActiva === 'todas' ? '#fff' : '#374151' }}
          >
            Todos ({contenidosData.length})
          </button>
          {Object.entries(CATEGORIAS).map(([clave, cat]) => {
            const count = contenidosData.filter((i) => i.categoria === clave).length;
            return (
              <button
                key={clave}
                type="button"
                onClick={() => setCategoriaActiva(clave)}
                style={{ padding: '0.4rem 1rem', borderRadius: '20px', border: `2px solid ${cat.colorBorde}`, cursor: 'pointer', fontWeight: '600', backgroundColor: categoriaActiva === clave ? cat.colorBorde : '#fff', color: categoriaActiva === clave ? '#fff' : cat.colorBorde }}
              >
                {cat.icono} {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* RESULTADOS */}
      {resultados.length === 0 && (
        <section style={{ marginTop: '1rem', padding: '2rem', textAlign: 'center', color: '#9ca3af', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          Sin resultados para "<strong>{busqueda}</strong>". Prueba con otro término.
        </section>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {resultados.map((item) => {
          const cat = CATEGORIAS[item.categoria];
          const abierto = itemAbierto === item.id;
          return (
            <div
              key={item.id}
              style={{ backgroundColor: '#fff', borderRadius: '8px', border: `1px solid ${abierto ? cat.colorBorde : '#e5e7eb'}`, boxShadow: abierto ? `0 0 0 3px ${cat.color}` : '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'all 0.2s' }}
            >
              {/* CABECERA */}
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{item.icono}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>{item.titulo}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.15rem' }}>{item.resumen}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', padding: '2px 10px', backgroundColor: cat.color, color: cat.colorBorde, borderRadius: '10px', fontWeight: '600' }}>
                    {cat.label}
                  </span>
                  <span style={{ fontSize: '1.2rem', color: '#9ca3af', transition: 'transform 0.2s', transform: abierto ? 'rotate(180deg)' : 'none' }}>▼</span>
                </div>
              </button>

              {/* CONTENIDO EXPANDIDO */}
              {abierto && (
                <div style={{ padding: '0 1.25rem 1.25rem', borderTop: `1px solid ${cat.color}` }}>
                  {/* PASOS */}
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ color: cat.colorBorde, marginBottom: '0.75rem' }}>
                      {item.categoria === 'escala' ? '📋 Cómo calcularlo' : item.categoria === 'emergencia' ? '⚡ Pasos de actuación' : '📋 Cómo hacerlo paso a paso'}
                    </h4>
                    <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {item.pasos.map((paso, i) => (
                        <li key={i} style={{ color: '#374151', lineHeight: '1.5', padding: '0.35rem 0' }}>
                          {paso}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* ALERTAS */}
                  {item.alertas?.length > 0 && (
                    <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', backgroundColor: item.categoria === 'emergencia' ? '#fff1f2' : '#fffbeb', borderRadius: '6px', border: `1px solid ${item.categoria === 'emergencia' ? '#fca5a5' : '#fcd34d'}` }}>
                      <div style={{ fontWeight: '700', marginBottom: '0.4rem', color: item.categoria === 'emergencia' ? '#dc2626' : '#92400e' }}>
                        {item.categoria === 'emergencia' ? '🔴 Puntos críticos' : '⚠ Recordar'}
                      </div>
                      <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {item.alertas.map((alerta, i) => (
                          <li key={i} style={{ color: item.categoria === 'emergencia' ? '#7f1d1d' : '#78350f', fontSize: '0.9rem' }}>{alerta}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RESUMEN ESTADÍSTICAS */}
      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {Object.entries(CATEGORIAS).map(([clave, cat]) => {
          const count = contenidosData.filter((i) => i.categoria === clave).length;
          return (
            <div
              key={clave}
              style={{ padding: '1rem', backgroundColor: cat.color, borderRadius: '8px', border: `1px solid ${cat.colorBorde}`, textAlign: 'center', cursor: 'pointer' }}
              onClick={() => { setCategoriaActiva(clave); setBusqueda(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <div style={{ fontSize: '1.5rem' }}>{cat.icono}</div>
              <div style={{ fontWeight: '700', fontSize: '1.5rem', color: cat.colorBorde }}>{count}</div>
              <div style={{ fontSize: '0.78rem', color: '#374151' }}>{cat.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
