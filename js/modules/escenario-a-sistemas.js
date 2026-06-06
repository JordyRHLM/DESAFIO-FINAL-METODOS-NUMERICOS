/* ═══════════════════════════════════════════════════════════════
   ESCENARIO A — Sistemas de ecuaciones lineales
   Responde:
   ✓ ¿Cuánto debe enviarse a cada zona?
   ✓ ¿Qué pasa si una ruta se bloquea?
   ✓ ¿Qué zona queda más afectada?
   ✓ ¿El sistema es estable o sensible?
   ✓ ¿La solución cambia mucho si la demanda aumenta?
═══════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN GLOBAL DE GRÁFICOS
// ═══════════════════════════════════════════════════════════════

const CHART_CONFIG_A = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } }
    }
  },
  scales: {
    x: { ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' } },
    y: { ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' } }
  }
};

// ═══════════════════════════════════════════════════════════════
// PRESETS — matrices diagonalmente dominantes
// ═══════════════════════════════════════════════════════════════

const PRESETS = {
  base: {
    A: [
      [10.0, 1.5, 0.5],
      [ 1.0,10.0, 1.5],
      [ 0.5, 1.0,10.0]
    ],
    b: [220, 285, 195],
    desc: '✅ Caso base · Distribución normal sin bloqueos'
  },
  bloqueo: {
    A: [
      [10.0, 0.2, 0.5],   // a12 reducido: ruta bloqueada
      [ 1.0,10.0, 1.5],
      [ 0.5, 1.0,10.0]
    ],
    b: [220, 285, 195],
    desc: '🚧 Bloqueo ruta Senkata → Centro (04/06/2026)'
  },
  demandaAlta: {
    A: [
      [10.0, 0.2, 0.5],
      [ 1.0,10.0, 1.5],
      [ 0.5, 1.0,10.0]
    ],
    b: [330, 428, 293],   // +50%
    desc: '📈 Emergencia · Demanda +50% por pánico de desabastecimiento'
  }
};

// ═══════════════════════════════════════════════════════════════
// LECTURA / ESCRITURA DEL FORMULARIO
// ═══════════════════════════════════════════════════════════════

function getMatrix() {
  const inputs = document.querySelectorAll('#matrixA input');
  if (inputs.length < 9) throw new Error('No se encontraron los 9 inputs de la matriz A');
  return [
    [parseFloat(inputs[0].value), parseFloat(inputs[1].value), parseFloat(inputs[2].value)],
    [parseFloat(inputs[3].value), parseFloat(inputs[4].value), parseFloat(inputs[5].value)],
    [parseFloat(inputs[6].value), parseFloat(inputs[7].value), parseFloat(inputs[8].value)]
  ];
}

function getVector() {
  return [
    parseFloat(document.getElementById('b0').value),
    parseFloat(document.getElementById('b1').value),
    parseFloat(document.getElementById('b2').value)
  ];
}

function setMatrix(A) {
  const inputs = document.querySelectorAll('#matrixA input');
  A.forEach((row, i) => row.forEach((val, j) => { inputs[i * 3 + j].value = val; }));
}

function setVector(b) {
  ['b0','b1','b2'].forEach((id, i) => { document.getElementById(id).value = b[i]; });
}

// ═══════════════════════════════════════════════════════════════
// OPERACIONES MATRICIALES
// ═══════════════════════════════════════════════════════════════

function norm(v)        { return Math.hypot(...v); }
function dot(a, b)      { return a.reduce((s, v, i) => s + v * b[i], 0); }
function matvec(A, v)   { return A.map(row => dot(row, v)); }
function cloneMatrix(M) { return M.map(row => [...row]); }
function fmt(x, d = 2)  { return isFinite(x) ? x.toFixed(d) : 'N/A'; }

function isDiagDominant(A) {
  return A.every((row, i) =>
    Math.abs(row[i]) > row.reduce((s, v, j) => j !== i ? s + Math.abs(v) : s, 0)
  );
}

// ═══════════════════════════════════════════════════════════════
// NÚMERO DE CONDICIÓN κ(A)
// ═══════════════════════════════════════════════════════════════

function conditionNumber(A) {
  try {
    const n = A.length;
    const inv = Array.from({ length: n }, (_, j) => {
      const e = Array(n).fill(0); e[j] = 1;
      return solveLU(A, e).x;
    });
    const Ainv   = Array.from({ length: n }, (_, i) => inv.map(col => col[i]));
    const normA   = Math.max(...A.map(row => row.reduce((s, v) => s + Math.abs(v), 0)));
    const normAinv = Math.max(...Ainv.map(row => row.reduce((s, v) => s + Math.abs(v), 0)));
    return normA * normAinv;
  } catch { return Infinity; }
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 1: FACTORIZACIÓN LU (DOOLITTLE)
// ═══════════════════════════════════════════════════════════════

function solveLU(Aorig, borig) {
  const n = Aorig.length;
  const A = cloneMatrix(Aorig);
  const L = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => i === j ? 1 : 0));
  const U = Array.from({ length: n }, () => Array(n).fill(0));

  for (let k = 0; k < n; k++) {
    for (let j = k; j < n; j++)
      U[k][j] = A[k][j] - L[k].slice(0, k).reduce((s, l, p) => s + l * U[p][j], 0);
    for (let i = k + 1; i < n; i++) {
      const sum = L[i].slice(0, k).reduce((s, l, p) => s + l * U[p][k], 0);
      if (Math.abs(U[k][k]) < 1e-14) throw new Error('Pivote nulo — matriz singular');
      L[i][k] = (A[i][k] - sum) / U[k][k];
    }
  }
  const y = Array(n).fill(0);
  for (let i = 0; i < n; i++)
    y[i] = borig[i] - L[i].slice(0, i).reduce((s, l, j) => s + l * y[j], 0);
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--)
    x[i] = (y[i] - U[i].slice(i + 1).reduce((s, u, k) => s + u * x[i + 1 + k], 0)) / U[i][i];
  return { x, L, U };
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 2: JACOBI
// ═══════════════════════════════════════════════════════════════

function solveJacobi(A, b, tol, maxIter) {
  const n = A.length;
  let x = Array(n).fill(0);
  const history = [];
  for (let iter = 0; iter < maxIter; iter++) {
    const xNew = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) if (j !== i) sum += A[i][j] * x[j];
      if (Math.abs(A[i][i]) < 1e-14) throw new Error(`Diagonal nula en fila ${i}`);
      xNew[i] = (b[i] - sum) / A[i][i];
    }
    const err = norm(xNew.map((v, i) => v - x[i])) / (norm(xNew) || 1);
    history.push({ iter: iter + 1, x: [...xNew], error: err });
    x = xNew;
    if (err < tol) return { x, history, converged: true };
  }
  return { x, history, converged: false };
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 3: GAUSS-SEIDEL
// ═══════════════════════════════════════════════════════════════

function solveGS(A, b, tol, maxIter) {
  const n = A.length;
  let x = Array(n).fill(0);
  const history = [];
  for (let iter = 0; iter < maxIter; iter++) {
    const xOld = [...x];
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) if (j !== i) sum += A[i][j] * x[j];
      if (Math.abs(A[i][i]) < 1e-14) throw new Error(`Diagonal nula en fila ${i}`);
      x[i] = (b[i] - sum) / A[i][i];
    }
    const err = norm(x.map((v, i) => v - xOld[i])) / (norm(x) || 1);
    history.push({ iter: iter + 1, x: [...x], error: err });
    if (err < tol) return { x, history, converged: true };
  }
  return { x, history, converged: false };
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 4: SOR
// ═══════════════════════════════════════════════════════════════

function solveSOR(A, b, tol, maxIter, omega) {
  const n = A.length;
  let x = Array(n).fill(0);
  const history = [];
  for (let iter = 0; iter < maxIter; iter++) {
    const xOld = [...x];
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) if (j !== i) sum += A[i][j] * x[j];
      if (Math.abs(A[i][i]) < 1e-14) throw new Error(`Diagonal nula en fila ${i}`);
      const xGS = (b[i] - sum) / A[i][i];
      x[i] = (1 - omega) * x[i] + omega * xGS;
    }
    const err = norm(x.map((v, i) => v - xOld[i])) / (norm(x) || 1);
    history.push({ iter: iter + 1, x: [...x], error: err });
    if (err < tol) return { x, history, converged: true };
  }
  return { x, history, converged: false };
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 5: GRADIENTE CONJUGADO
// ═══════════════════════════════════════════════════════════════

function solveCG(Aorig, b, tol, maxIter) {
  const n = Aorig.length;
  const A = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (Aorig[i][j] + Aorig[j][i]) / 2));
  let x = Array(n).fill(0);
  let r = b.map((bi, i) => bi - dot(A[i], x));
  let p = [...r], rr = dot(r, r);
  const history = [];
  for (let iter = 0; iter < maxIter; iter++) {
    const Ap = matvec(A, p), pAp = dot(p, Ap);
    if (Math.abs(pAp) < 1e-14) break;
    const alpha = rr / pAp;
    x = x.map((xi, i) => xi + alpha * p[i]);
    r = r.map((ri, i) => ri - alpha * Ap[i]);
    const rr_new = dot(r, r), err = Math.sqrt(rr_new);
    history.push({ iter: iter + 1, x: [...x], error: err });
    if (err < tol) return { x, history, converged: true };
    p = r.map((ri, i) => ri + (rr_new / rr) * p[i]);
    rr = rr_new;
  }
  return { x, history, converged: false };
}

// ═══════════════════════════════════════════════════════════════
// ANÁLISIS DE IMPACTO DEL BLOQUEO
// Compara la solución base vs. bloqueo para detectar zona más afectada
// ═══════════════════════════════════════════════════════════════

function analizarImpactoBloqueo(xBase, xBloqueo) {
  const zonas = ['El Alto', 'La Paz Centro', 'La Paz Sur'];
  const diffs  = xBase.map((v, i) => ({
    zona:    zonas[i],
    base:    v,
    bloqueo: xBloqueo[i],
    diff:    v - xBloqueo[i],
    pct:     v > 0.01 ? ((v - xBloqueo[i]) / v * 100) : 0
  }));
  const masAfectada = diffs.reduce((a, b) => Math.abs(a.diff) > Math.abs(b.diff) ? a : b);
  return { diffs, masAfectada };
}

// ═══════════════════════════════════════════════════════════════
// ANÁLISIS SENSIBILIDAD — Demanda +10% y -10%
// ═══════════════════════════════════════════════════════════════

function analizarSensibilidad(A, b) {
  const bUp   = b.map(v => v * 1.10);
  const bDown = b.map(v => v * 0.90);
  const base  = solveLU(A, b).x;
  const up    = solveLU(A, bUp).x;
  const down  = solveLU(A, bDown).x;
  const maxCambio = base.map((v, i) => Math.abs(up[i] - v) / (Math.abs(v) || 1) * 100);
  return { base, up, down, maxCambio };
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZADO — GRÁFICOS
// ═══════════════════════════════════════════════════════════════

const chartsA = {};
function destroyA(id) { if (chartsA[id]) { chartsA[id].destroy(); delete chartsA[id]; } }

function renderBarChart(canvasId, x) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  destroyA(canvasId);
  chartsA[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Zona 1 (El Alto)', 'Zona 2 (Centro)', 'Zona 3 (Sur)'],
      datasets: [{
        label: 'Distribución (miles L/día)',
        data: x.map(v => parseFloat(v.toFixed(2))),
        backgroundColor: ['#c9a84c55','#5b9bd555','#4caf8255'],
        borderColor:     ['#c9a84c','#5b9bd5','#4caf82'],
        borderWidth: 2, borderRadius: 6
      }]
    },
    options: {
      ...CHART_CONFIG_A,
      scales: {
        x: { ...CHART_CONFIG_A.scales.x,
          title: { display: true, text: 'Zonas de distribución', color: '#8b919e' } },
        y: { ...CHART_CONFIG_A.scales.y,
          title: { display: true, text: 'Miles de litros/día', color: '#8b919e' } }
      }
    }
  });
}

function renderConvergenceChart(canvasId, history, label, color) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !history?.length) return;
  destroyA(canvasId);
  chartsA[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.map(h => h.iter),
      datasets: [{
        label, fill: true,
        data: history.map(h => Math.max(h.error, 1e-16)),
        borderColor: color, backgroundColor: color + '20',
        borderWidth: 2,
        pointRadius: history.length > 30 ? 0 : 3, tension: 0.2
      }]
    },
    options: {
      ...CHART_CONFIG_A,
      scales: {
        x: { ...CHART_CONFIG_A.scales.x,
          title: { display: true, text: 'Iteración', color: '#8b919e' } },
        y: { ...CHART_CONFIG_A.scales.y,
          type: 'logarithmic',
          title: { display: true, text: 'Error relativo (log)', color: '#8b919e' } }
      }
    }
  });
}

function renderImpactoChart(base, bloqueo) {
  const ctx = document.getElementById('chartImpacto');
  if (!ctx) return;
  destroyA('chartImpacto');
  chartsA['chartImpacto'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Zona 1 (El Alto)', 'Zona 2 (Centro)', 'Zona 3 (Sur)'],
      datasets: [
        {
          label: 'Sin bloqueo (caso base)',
          data: base.map(v => parseFloat(v.toFixed(2))),
          backgroundColor: '#4caf8255', borderColor: '#4caf82', borderWidth: 2, borderRadius: 4
        },
        {
          label: 'Con bloqueo',
          data: bloqueo.map(v => parseFloat(v.toFixed(2))),
          backgroundColor: '#e0525255', borderColor: '#e05252', borderWidth: 2, borderRadius: 4
        }
      ]
    },
    options: {
      ...CHART_CONFIG_A,
      scales: {
        x: { ...CHART_CONFIG_A.scales.x,
          title: { display: true, text: 'Zona', color: '#8b919e' } },
        y: { ...CHART_CONFIG_A.scales.y,
          title: { display: true, text: 'Miles de litros/día', color: '#8b919e' } }
      }
    }
  });
}

function renderSensibilidadChart(base, up, down) {
  const ctx = document.getElementById('chartSensibilidad');
  if (!ctx) return;
  destroyA('chartSensibilidad');
  chartsA['chartSensibilidad'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Zona 1 (El Alto)', 'Zona 2 (Centro)', 'Zona 3 (Sur)'],
      datasets: [
        {
          label: 'Demanda −10%',
          data: down.map(v => parseFloat(v.toFixed(2))),
          backgroundColor: '#5b9bd555', borderColor: '#5b9bd5', borderWidth: 2, borderRadius: 4
        },
        {
          label: 'Demanda base',
          data: base.map(v => parseFloat(v.toFixed(2))),
          backgroundColor: '#c9a84c55', borderColor: '#c9a84c', borderWidth: 2, borderRadius: 4
        },
        {
          label: 'Demanda +10%',
          data: up.map(v => parseFloat(v.toFixed(2))),
          backgroundColor: '#e0525255', borderColor: '#e05252', borderWidth: 2, borderRadius: 4
        }
      ]
    },
    options: {
      ...CHART_CONFIG_A,
      scales: {
        x: { ...CHART_CONFIG_A.scales.x,
          title: { display: true, text: 'Zona', color: '#8b919e' } },
        y: { ...CHART_CONFIG_A.scales.y,
          title: { display: true, text: 'Miles de litros/día', color: '#8b919e' } }
      }
    }
  });
}

function renderCompareChart(datasets) {
  const ctx = document.getElementById('chartCompare');
  if (!ctx) return;
  destroyA('chartCompare');
  const colors = {
    'Jacobi': '#5b9bd5', 'Gauss-Seidel': '#4caf82',
    'SOR': '#e6a817', 'Grad. Conjugado': '#c9a84c'
  };
  chartsA['chartCompare'] = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: datasets.map(d => ({
        label: d.label, showLine: true,
        data: d.history.map(h => ({ x: h.iter, y: Math.max(h.error, 1e-16) })),
        borderColor: colors[d.label] || '#888',
        borderWidth: 2, pointRadius: 0, tension: 0.2
      }))
    },
    options: {
      ...CHART_CONFIG_A, parsing: false,
      scales: {
        x: { type: 'linear', ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' },
          title: { display: true, text: 'Iteración', color: '#8b919e' } },
        y: { type: 'logarithmic', ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' },
          title: { display: true, text: 'Error relativo (log)', color: '#8b919e' } }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZADO — TABLAS DE ITERACIONES
// ═══════════════════════════════════════════════════════════════

function renderIterTable(containerId, history) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!history?.length) {
    container.innerHTML = '<div class="table-empty">Sin datos de iteración</div>'; return;
  }
  const rows = history.slice(0, 30);
  container.innerHTML = `
    <table class="table">
      <thead><tr>
        <th>Iter</th>
        <th class="right">x₁ (El Alto)</th>
        <th class="right">x₂ (Centro)</th>
        <th class="right">x₃ (Sur)</th>
        <th class="right">Error</th>
      </tr></thead>
      <tbody>
        ${rows.map(({ iter, x, error }) => `
          <tr>
            <td class="center">${iter}</td>
            <td class="right">${fmt(x[0], 3)}</td>
            <td class="right">${fmt(x[1], 3)}</td>
            <td class="right">${fmt(x[2], 3)}</td>
            <td class="right highlight">${error.toExponential(3)}</td>
          </tr>`).join('')}
        ${history.length > 30
          ? `<tr><td colspan="5" class="table-empty" style="font-size:0.75rem">
              ... ${history.length - 30} iteraciones más</td></tr>` : ''}
      </tbody>
    </table>`;
}

// ═══════════════════════════════════════════════════════════════
// INTERPRETACIÓN POR MÉTODO — responde las 5 preguntas
// ═══════════════════════════════════════════════════════════════

function buildInterpretacion(luRes, A, b, kappa, omega, impacto, sens) {
  if (!luRes) return;
  const x     = luRes.x;
  const total = x.reduce((s, v) => s + v, 0);
  const pct   = v => total > 0 ? ((v / total) * 100).toFixed(1) : '0.0';

  // Zona más afectada por el bloqueo
  const zonaAfect = impacto?.masAfectada;

  // Sensibilidad: ¿cambia mucho con +10% de demanda?
  const maxCambioPct = sens ? Math.max(...sens.maxCambio).toFixed(1) : '—';
  const estable      = sens ? Math.max(...sens.maxCambio) < 15 : true;

  // Estabilidad del sistema
  const condTexto = !isFinite(kappa)
    ? `La matriz es <strong style="color:#e07272">SINGULAR</strong>: el sistema no tiene solución única.`
    : kappa > 1000
      ? `κ(A) = ${kappa.toExponential(2)} → <strong style="color:#e07272">MAL CONDICIONADO</strong>: 
         errores pequeños en la demanda se amplifican enormemente en la distribución.`
      : kappa > 100
        ? `κ(A) = ${kappa.toExponential(2)} → <strong style="color:#e6c35a">MODERADAMENTE CONDICIONADO</strong>: 
           el bloqueo aumenta la sensibilidad del sistema.`
        : `κ(A) = ${kappa.toExponential(2)} → <strong style="color:#6dcc9e">BIEN CONDICIONADO</strong>: 
           el sistema responde de forma estable y proporcional.`;

  // Texto base compartido para todos los métodos
  const pregunta1 = `
    <p><strong>¿Cuánto debe enviarse a cada zona?</strong><br>
    Zona 1 — El Alto: <strong>${fmt(x[0],2)}</strong> miles L/día (${pct(x[0])}%) ·
    Zona 2 — Centro: <strong>${fmt(x[1],2)}</strong> miles L/día (${pct(x[1])}%) ·
    Zona 3 — Sur: <strong>${fmt(x[2],2)}</strong> miles L/día (${pct(x[2])}%). 
    Total distribuido: <strong>${fmt(total,2)} miles L/día</strong>.</p>`;

  const pregunta2 = zonaAfect ? `
    <p><strong>¿Qué zona queda más afectada por el bloqueo?</strong><br>
    La <strong>${zonaAfect.zona}</strong> es la más afectada: pasa de
    <strong>${fmt(zonaAfect.base,2)}</strong> a <strong>${fmt(zonaAfect.bloqueo,2)}</strong> miles L/día
    (reducción de <strong>${fmt(Math.abs(zonaAfect.diff),2)}</strong> miles L/día =
    <strong>${Math.abs(zonaAfect.pct).toFixed(1)}%</strong>).</p>` : '';

  const pregunta3 = `
    <p><strong>¿El sistema es estable o sensible?</strong><br>
    ${condTexto}</p>`;

  const pregunta4 = sens ? `
    <p><strong>¿La solución cambia mucho si la demanda aumenta un 10%?</strong><br>
    ${estable
      ? `El mayor cambio es de <strong>${maxCambioPct}%</strong> — el sistema <strong style="color:#6dcc9e">responde proporcionalmente</strong>. 
         Una variación del 10% en demanda produce un cambio similar en la distribución.`
      : `El mayor cambio es de <strong>${maxCambioPct}%</strong> — el sistema es <strong style="color:#e07272">muy sensible</strong>. 
         Un aumento pequeño en demanda puede desabastecer una zona.`
    }</p>` : '';

  const textos = {
    'interpLU': `${pregunta1}${pregunta2}${pregunta3}${pregunta4}
      <p><strong>Sobre el método LU:</strong> Factoriza A = L·U (triangular inferior × superior) y 
      resuelve dos sistemas triangulares en O(n³). Es el método <strong>exacto</strong> de referencia.
      No itera — entrega la solución en un único paso. Ideal para sistemas pequeños y bien condicionados.</p>`,

    'interpJacobi': `${pregunta1}${pregunta2}${pregunta3}${pregunta4}
      <p><strong>Sobre Jacobi:</strong> Actualiza todas las variables <em>simultáneamente</em> 
      usando los valores de la iteración anterior (x_old). Converge cuando |a_ii| > Σ|a_ij|
      (dominancia diagonal). Es el más lento de los iterativos pero el más fácil de paralelizar — 
      útil cuando cada ruta de distribución se actualiza de forma independiente.</p>`,

    'interpGS': `${pregunta1}${pregunta2}${pregunta3}${pregunta4}
      <p><strong>Sobre Gauss-Seidel:</strong> Usa los valores <em>recién calculados</em>
      dentro de la misma iteración. Converge aproximadamente <strong>2× más rápido</strong> 
      que Jacobi. Simula el ajuste en cadena de rutas: al redistribuir una zona, la siguiente 
      ya usa esa información actualizada.</p>`,

    'interpSOR': `${pregunta1}${pregunta2}${pregunta3}${pregunta4}
      <p><strong>Sobre SOR (ω = ${omega}):</strong> Pondera el paso de Gauss-Seidel con 
      un factor de relajación ω. Con ω > 1 se acelera la convergencia (sobrerrelajación); 
      con ω &lt; 1 se estabiliza el sistema. El ω óptimo para matrices similares a ésta 
      está en el rango 1.1–1.5. Prueba distintos valores y compara el número de iteraciones.</p>`,

    'interpCG': `${pregunta1}${pregunta2}${pregunta3}${pregunta4}
      <p><strong>Sobre Gradiente Conjugado:</strong> Minimiza el error en la norma A-energética 
      en cada paso. Teóricamente converge en ≤ n pasos exactos (n = tamaño del sistema).
      Requiere A simétrica definida positiva — el algoritmo la simetriza si no lo es.
      Ideal para sistemas grandes y dispersos donde LU sería muy costoso.</p>`
  };

  Object.entries(textos).forEach(([id, html]) => {
    const block  = document.getElementById(id);
    const textEl = document.getElementById(id + '-text');
    if (block && textEl) { textEl.innerHTML = html; block.style.display = 'block'; }
  });
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL — RESOLVER CON TODOS LOS MÉTODOS
// ═══════════════════════════════════════════════════════════════

function solveAll() {
  let A, b;
  try { A = getMatrix(); b = getVector(); }
  catch (e) { alert('Error leyendo la matriz: ' + e.message); return; }

  const tol     = parseFloat(document.getElementById('tolerance').value) || 1e-4;
  const maxIter = parseInt(document.getElementById('maxIter').value)     || 100;
  const omega   = parseFloat(document.getElementById('omegaSOR').value)  || 1.25;

  // Aviso de dominancia diagonal
  const banner = document.getElementById('diagWarning');
  if (banner) banner.style.display = isDiagDominant(A) ? 'none' : 'flex';

  // Número de condición
  const kappa  = conditionNumber(A);
  const condEl = document.getElementById('condNum');
  if (condEl) condEl.innerHTML = isFinite(kappa) ? kappa.toExponential(2) : '∞';

  // Análisis de impacto con preset "bloqueo"
  let impacto = null;
  try {
    const xBase    = solveLU(A, b).x;
    const ABloqueo = cloneMatrix(A);
    ABloqueo[0][1] = Math.min(A[0][1], 0.2);  // simular bloqueo a12
    const xBloqueo = solveLU(ABloqueo, b).x;
    impacto = analizarImpactoBloqueo(xBase, xBloqueo);
  } catch { /* no disponible */ }

  // Análisis de sensibilidad
  let sens = null;
  try { sens = analizarSensibilidad(A, b); } catch { /* no disponible */ }

  // ─── LU ─────────────────────────────────────────────────────
  let luResult = null;
  try {
    luResult = solveLU(A, b);
    const { x } = luResult;
    const hasNeg = x.some(v => v < -0.01);

    document.getElementById('resultLU').innerHTML = `
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:10px;">
        <div class="result-box">
          <div class="result-box__label">Zona 1 (El Alto)</div>
          <div class="result-box__value">${fmt(x[0], 2)}</div>
          <div style="font-size:0.7rem;opacity:.6;">miles L/día</div>
        </div>
        <div class="result-box">
          <div class="result-box__label">Zona 2 (La Paz Centro)</div>
          <div class="result-box__value">${fmt(x[1], 2)}</div>
          <div style="font-size:0.7rem;opacity:.6;">miles L/día</div>
        </div>
        <div class="result-box">
          <div class="result-box__label">Zona 3 (La Paz Sur)</div>
          <div class="result-box__value">${fmt(x[2], 2)}</div>
          <div style="font-size:0.7rem;opacity:.6;">miles L/día</div>
        </div>
      </div>
      ${hasNeg ? '<div class="alert alert-warning">⚠️ Valores negativos detectados — la matriz puede no representar un sistema de flujo físicamente válido.</div>' : ''}
      <div style="font-size:0.75rem;opacity:.6;margin-top:8px;">✓ Método directo · Solución exacta (precisión máquina)</div>`;

    renderBarChart('chartLU', x);
    ['solNorte','solCentro','solSur'].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = fmt(x[i], 2);
    });
  } catch (e) {
    document.getElementById('resultLU').innerHTML =
      `<div class="alert alert-danger">⚠️ LU falló: ${e.message}</div>`;
  }

  // ─── JACOBI ─────────────────────────────────────────────────
  try {
    const jacobi = solveJacobi(A, b, tol, maxIter);
    document.getElementById('resultJacobi').innerHTML = `
      <div style="font-size:0.9rem;margin-bottom:6px;">
        <strong>x₁:</strong> ${fmt(jacobi.x[0],2)} &ensp;
        <strong>x₂:</strong> ${fmt(jacobi.x[1],2)} &ensp;
        <strong>x₃:</strong> ${fmt(jacobi.x[2],2)}
      </div>
      <div style="font-size:0.75rem;opacity:.65;">
        Iteraciones: ${jacobi.history.length} &nbsp;·&nbsp;
        Convergió: ${jacobi.converged
          ? '✓ Sí'
          : '✗ No — aumenta maxIter o usa una matriz diagonalmente dominante'}
      </div>`;
    renderConvergenceChart('chartJacobi', jacobi.history, 'Error Jacobi', '#5b9bd5');
    renderIterTable('tableJacobi', jacobi.history);
  } catch (e) {
    document.getElementById('resultJacobi').innerHTML =
      `<div class="alert alert-danger">⚠️ Jacobi: ${e.message}</div>`;
  }

  // ─── GAUSS-SEIDEL ───────────────────────────────────────────
  try {
    const gs = solveGS(A, b, tol, maxIter);
    document.getElementById('resultGS').innerHTML = `
      <div style="font-size:0.9rem;margin-bottom:6px;">
        <strong>x₁:</strong> ${fmt(gs.x[0],2)} &ensp;
        <strong>x₂:</strong> ${fmt(gs.x[1],2)} &ensp;
        <strong>x₃:</strong> ${fmt(gs.x[2],2)}
      </div>
      <div style="font-size:0.75rem;opacity:.65;">
        Iteraciones: ${gs.history.length} &nbsp;·&nbsp;
        Convergió: ${gs.converged ? '✓ Sí' : '✗ No'}
      </div>`;
    renderConvergenceChart('chartGS', gs.history, 'Error Gauss-Seidel', '#4caf82');
    renderIterTable('tableGS', gs.history);
  } catch (e) {
    document.getElementById('resultGS').innerHTML =
      `<div class="alert alert-danger">⚠️ Gauss-Seidel: ${e.message}</div>`;
  }

  // ─── SOR ────────────────────────────────────────────────────
  try {
    const sor = solveSOR(A, b, tol, maxIter, omega);
    document.getElementById('resultSOR').innerHTML = `
      <div style="font-size:0.9rem;margin-bottom:6px;">
        <strong>x₁:</strong> ${fmt(sor.x[0],2)} &ensp;
        <strong>x₂:</strong> ${fmt(sor.x[1],2)} &ensp;
        <strong>x₃:</strong> ${fmt(sor.x[2],2)}
      </div>
      <div style="font-size:0.75rem;opacity:.65;">
        ω = ${omega} &nbsp;·&nbsp; Iteraciones: ${sor.history.length} &nbsp;·&nbsp;
        Convergió: ${sor.converged ? '✓ Sí' : '✗ No'}
      </div>`;
    renderConvergenceChart('chartSOR', sor.history, `Error SOR (ω=${omega})`, '#e6a817');
    renderIterTable('tableSOR', sor.history);
  } catch (e) {
    document.getElementById('resultSOR').innerHTML =
      `<div class="alert alert-danger">⚠️ SOR: ${e.message}</div>`;
  }

  // ─── GRADIENTE CONJUGADO ─────────────────────────────────────
  try {
    const cg = solveCG(A, b, tol, maxIter);
    document.getElementById('resultCG').innerHTML = `
      <div style="font-size:0.9rem;margin-bottom:6px;">
        <strong>x₁:</strong> ${fmt(cg.x[0],2)} &ensp;
        <strong>x₂:</strong> ${fmt(cg.x[1],2)} &ensp;
        <strong>x₃:</strong> ${fmt(cg.x[2],2)}
      </div>
      <div style="font-size:0.75rem;opacity:.65;">
        Iteraciones: ${cg.history.length} &nbsp;·&nbsp;
        Convergió: ${cg.converged ? '✓ Sí' : '✗ No'}
      </div>`;
    renderConvergenceChart('chartCG', cg.history, '‖Residuo‖ Grad. Conjugado', '#c9a84c');
    renderIterTable('tableCG', cg.history);
  } catch (e) {
    document.getElementById('resultCG').innerHTML =
      `<div class="alert alert-danger">⚠️ Grad. Conjugado: ${e.message}</div>`;
  }

  // ─── TABLA COMPARATIVA + GRÁFICOS ANÁLISIS ──────────────────
  try {
    const jacobi = solveJacobi(A, b, tol, maxIter);
    const gs     = solveGS(A, b, tol, maxIter);
    const sor    = solveSOR(A, b, tol, maxIter, omega);
    const cg     = solveCG(A, b, tol, maxIter);
    const lu     = luResult || solveLU(A, b);

    const lastErr = arr => arr?.length ? arr[arr.length-1].error.toExponential(2) : '—';
    const compareBody = document.getElementById('compareBody');
    if (compareBody) {
      compareBody.innerHTML = `
        <tr>
          <td><strong>LU (directo)</strong></td>
          <td class="center">—</td>
          <td class="right">≈ 0 (exacto)</td>
          <td class="right">${fmt(lu.x[0],2)}</td>
          <td class="right">${fmt(lu.x[1],2)}</td>
          <td class="right">${fmt(lu.x[2],2)}</td>
          <td class="center">✓</td>
        </tr>
        <tr>
          <td>Jacobi</td>
          <td class="center">${jacobi.history.length}</td>
          <td class="right">${lastErr(jacobi.history)}</td>
          <td class="right">${fmt(jacobi.x[0],2)}</td>
          <td class="right">${fmt(jacobi.x[1],2)}</td>
          <td class="right">${fmt(jacobi.x[2],2)}</td>
          <td class="center">${jacobi.converged ? '✓' : '✗'}</td>
        </tr>
        <tr>
          <td>Gauss-Seidel</td>
          <td class="center">${gs.history.length}</td>
          <td class="right">${lastErr(gs.history)}</td>
          <td class="right">${fmt(gs.x[0],2)}</td>
          <td class="right">${fmt(gs.x[1],2)}</td>
          <td class="right">${fmt(gs.x[2],2)}</td>
          <td class="center">${gs.converged ? '✓' : '✗'}</td>
        </tr>
        <tr>
          <td>SOR (ω=${omega})</td>
          <td class="center">${sor.history.length}</td>
          <td class="right">${lastErr(sor.history)}</td>
          <td class="right">${fmt(sor.x[0],2)}</td>
          <td class="right">${fmt(sor.x[1],2)}</td>
          <td class="right">${fmt(sor.x[2],2)}</td>
          <td class="center">${sor.converged ? '✓' : '✗'}</td>
        </tr>
        <tr>
          <td>Grad. Conjugado</td>
          <td class="center">${cg.history.length}</td>
          <td class="right">${lastErr(cg.history)}</td>
          <td class="right">${fmt(cg.x[0],2)}</td>
          <td class="right">${fmt(cg.x[1],2)}</td>
          <td class="right">${fmt(cg.x[2],2)}</td>
          <td class="center">${cg.converged ? '✓' : '✗'}</td>
        </tr>`;
    }

    // Gráfico convergencia comparada
    const datasets = [];
    if (jacobi.history.length) datasets.push({ label: 'Jacobi',         history: jacobi.history });
    if (gs.history.length)     datasets.push({ label: 'Gauss-Seidel',   history: gs.history });
    if (sor.history.length)    datasets.push({ label: 'SOR',            history: sor.history });
    if (cg.history.length)     datasets.push({ label: 'Grad. Conjugado',history: cg.history });
    if (datasets.length)       renderCompareChart(datasets);

    // Gráfico impacto bloqueo
    if (impacto) {
      renderImpactoChart(
        impacto.diffs.map(d => d.base),
        impacto.diffs.map(d => d.bloqueo)
      );
    }

    // Gráfico sensibilidad
    if (sens) renderSensibilidadChart(sens.base, sens.up, sens.down);

    // Insights panel comparativa
    const total = lu.x.reduce((s, v) => s + v, 0);
    const pct   = v => total > 0 ? ((v / total) * 100).toFixed(1) : '0.0';

    const insightDistrib = document.getElementById('insightDistrib');
    if (insightDistrib) insightDistrib.innerHTML = `
      <strong>¿Cuánto debe enviarse a cada zona?</strong><br>
      El Alto: <strong>${fmt(lu.x[0],2)}</strong> miles L/día (${pct(lu.x[0])}%)<br>
      Centro:  <strong>${fmt(lu.x[1],2)}</strong> miles L/día (${pct(lu.x[1])}%)<br>
      Sur:     <strong>${fmt(lu.x[2],2)}</strong> miles L/día (${pct(lu.x[2])}%)<br>
      Total:   <strong>${fmt(total,2)}</strong> miles L/día`;

    const insightBloqueo = document.getElementById('insightBloqueo');
    if (insightBloqueo && impacto) {
      const { masAfectada, diffs } = impacto;
      insightBloqueo.innerHTML = `
        <strong>¿Qué pasa si una ruta se bloquea? ¿Qué zona queda más afectada?</strong><br>
        Al reducir la ruta hacia el Centro (a₁₂: 1.5 → 0.2), la zona más afectada es
        <strong>${masAfectada.zona}</strong>: cae de ${fmt(masAfectada.base,2)} 
        a ${fmt(masAfectada.bloqueo,2)} miles L/día 
        (−${Math.abs(masAfectada.pct).toFixed(1)}%).<br>
        ${diffs.map(d =>
          `${d.zona}: ${fmt(d.base,2)} → ${fmt(d.bloqueo,2)} (${d.pct >= 0 ? '−' : '+'}${Math.abs(d.pct).toFixed(1)}%)`
        ).join(' · ')}`;
    }

    const insightCond = document.getElementById('insightCond');
    if (insightCond) {
      insightCond.innerHTML = !isFinite(kappa)
        ? `⚠️ <strong>Matriz singular.</strong> El sistema no tiene solución única.`
        : kappa > 1000
          ? `⚠️ <strong>κ(A) = ${kappa.toExponential(2)} — MAL CONDICIONADO.</strong>
             Pequeños errores en la demanda se amplifican en la distribución.`
          : kappa > 100
            ? `<strong>κ(A) = ${kappa.toExponential(2)} — MODERADO.</strong>
               El bloqueo aumenta la sensibilidad del sistema.`
            : `✓ <strong>κ(A) = ${kappa.toExponential(2)} — BIEN CONDICIONADO.</strong>
               El sistema es estable y responde proporcionalmente.`;
    }

    const insightSens = document.getElementById('insightSens');
    if (insightSens && sens) {
      const maxCambioPct = Math.max(...sens.maxCambio).toFixed(1);
      const estable      = Math.max(...sens.maxCambio) < 15;
      insightSens.innerHTML = `
        <strong>¿La solución cambia mucho si la demanda aumenta?</strong><br>
        Con demanda +10%, el mayor cambio es <strong>${maxCambioPct}%</strong>.
        ${estable
          ? '✓ El sistema <strong>responde proporcionalmente</strong> — es robusto ante variaciones moderadas de demanda.'
          : '⚠️ El sistema es <strong>muy sensible</strong> — un aumento pequeño en demanda puede desabastecer una zona.'}
        <br><small style="opacity:.6">Demanda −10%: x = [${sens.down.map(v=>fmt(v,2)).join(', ')}] · 
        Demanda +10%: x = [${sens.up.map(v=>fmt(v,2)).join(', ')}]</small>`;
    }

    const insightBest = document.getElementById('insightBest');
    if (insightBest) {
      const methods = [
        { name: 'Jacobi',         res: jacobi },
        { name: 'Gauss-Seidel',   res: gs },
        { name: `SOR (ω=${omega})`,res: sor },
        { name: 'Grad. Conjugado', res: cg }
      ].filter(m => m.res.converged);
      if (methods.length > 0) {
        const fastest = methods.reduce((a, b) =>
          a.res.history.length < b.res.history.length ? a : b);
        insightBest.innerHTML = `
          <strong>Método más eficiente:</strong> ${fastest.name}
          con <strong>${fastest.res.history.length} iteraciones</strong>.<br>
          <span style="font-size:0.8rem;opacity:.7;">
          GS es ~2× más rápido que Jacobi. SOR con ω óptimo supera a GS.
          LU es exacto en un paso — referencia para validar los iterativos.</span>`;
      } else {
        insightBest.innerHTML = `⚠️ Ningún método iterativo convergió. Verifica que la
          matriz sea diagonalmente dominante o aumenta el número de iteraciones.`;
      }
    }

  } catch (e) { console.error('Error en comparativa:', e); }

  // ─── INTERPRETACIONES EN CADA TAB ───────────────────────────
  buildInterpretacion(luResult, A, b, kappa, omega, impacto, sens);
}

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

function loadPreset(key) {
  const preset = PRESETS[key];
  if (!preset) { console.error('Preset no encontrado:', key); return; }
  setMatrix(preset.A);
  setVector(preset.b);
  const descEl = document.getElementById('presetDesc');
  if (descEl) { descEl.textContent = preset.desc; descEl.style.display = 'block'; }
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

function initTabs() {
  document.querySelectorAll('#moduloA .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('#moduloA .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#moduloA .tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('panel-' + tab);
      if (panel) panel.classList.add('active');
    });
  });
}

export function init() {
  initTabs();
  loadPreset('base');

  document.getElementById('btnSolve')?.addEventListener('click', solveAll);

  document.getElementById('btnClear')?.addEventListener('click', () => {
    ['resultLU','resultJacobi','resultGS','resultSOR','resultCG'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="text-muted">Ejecuta el cálculo</p>';
    });
    ['tableJacobi','tableGS','tableSOR','tableCG'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<div class="table-empty">Ejecuta el cálculo</div>';
    });
    ['interpLU','interpJacobi','interpGS','interpSOR','interpCG'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const cb = document.getElementById('compareBody');
    if (cb) cb.innerHTML = '<tr><td colspan="7" class="table-empty">Ejecuta el cálculo</td></tr>';
    ['solNorte','solCentro','solSur','condNum'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '—';
    });
    ['insightDistrib','insightBloqueo','insightCond','insightSens','insightBest']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = 'Ejecuta el cálculo para ver la interpretación.';
      });
    Object.keys(chartsA).forEach(k => { chartsA[k]?.destroy(); delete chartsA[k]; });
  });

  document.getElementById('btnPreset1')?.addEventListener('click', () => loadPreset('base'));
  document.getElementById('btnPreset2')?.addEventListener('click', () => loadPreset('bloqueo'));
  document.getElementById('btnPreset3')?.addEventListener('click', () => loadPreset('demandaAlta'));

  console.log('🚀 Escenario A inicializado');
}

if (document.getElementById('btnSolve')) init();