/* ═══════════════════════════════════════════════════════════════
   ESCENARIO E — Raíces de Ecuaciones No Lineales
   Modelo: Umbrales críticos de abastecimiento
   Métodos: Bisección · Newton-Raphson · Secante
   Bolivia 2026 — Crisis de desabastecimiento
═══════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
// PRESETS — Funciones con contexto real Bolivia 2026
// ═══════════════════════════════════════════════════════════════

const PRESETS_E = {
  vaciado: {
    expr:    '50 - 80 * Math.exp(0.05 * x)',
    a: 0, b: 15, x0: 5, x0sec: 0, x1sec: 10,
    desc:    '⛽ Día en que consumo supera reabastecimiento (vaciado)',
    contexto:'Encuentra el día t donde R\'(t) = 0: el consumo exponencial iguala al reabastecimiento diario. A partir de ese punto la reserva solo disminuye.'
  },
  costo: {
    expr:    '75 * Math.exp(0.02 * x) * x - 2500',
    a: 1, b: 45, x0: 20, x0sec: 5, x1sec: 25,
    desc:    '💰 Día en que el costo acumulado supera el ingreso familiar (2500 Bs)',
    contexto:'f(t) = gasto_diario·e^(k·t)·t − ingreso_mensual. La raíz es el día exacto donde el gasto acumulado iguala al salario familiar de 2500 Bs. Antes hay superávit; después, déficit.'
  },
  carburante: {
    expr:    '60 * Math.exp(0.04 * x) - 89',
    a: 0, b: 20, x0: 8, x0sec: 2, x1sec: 12,
    desc:    '⛽ Tasa de reposición crítica que iguala consumo y llegada de carburante',
    contexto:'g(r) = consumo_base·e^(k·t) − r. La raíz es la tasa de reposición mínima r* para que el sistema esté en equilibrio al día t=10. Si el suministro actual < r*, las reservas se vacían.'
  },
  opinion: {
    expr:    '0.08 * x * (1 - x/100) - 0.03 * x + 5',
    a: 1, b: 90, x0: 30, x0sec: 10, x1sec: 50,
    desc:    '📣 Umbral social: nivel de descontento donde el modelo pasa de estabilidad a masificación',
    contexto:'h(x) = β·x·(1−x/N) − γ·x + S. La raíz es el porcentaje de población descontenta donde el sistema deja de ser estable y el descontento se masifica (punto de bifurcación social).'
  },
  equilibrio: {
    expr:    'x * x * x - 2 * x - 5',
    a: 2, b: 3, x0: 2.5, x0sec: 2, x1sec: 3,
    desc:    '⚖️ Precio de equilibrio oferta-demanda (modelo cúbico)',
    contexto:'Modelo simplificado donde la diferencia entre oferta y demanda sigue una función cúbica. La raíz es el precio de equilibrio donde el mercado se estabiliza.'
  }
};

// ═══════════════════════════════════════════════════════════════
// EVALUACIÓN SEGURA DE FUNCIONES
// ═══════════════════════════════════════════════════════════════

function evalF(expr, x) {
  try {
    // eslint-disable-next-line no-new-func
    return Function('x', `"use strict"; return (${expr});`)(x);
  } catch {
    return NaN;
  }
}

// Derivada numérica por diferencias centrales
function derivada(expr, x, h = 1e-7) {
  return (evalF(expr, x + h) - evalF(expr, x - h)) / (2 * h);
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 1 — BISECCIÓN
// c = (a + b) / 2
// Si f(a)·f(c) < 0 → raíz en [a,c], si no → en [c,b]
// Convergencia: lineal · garantizada si f(a)·f(b) < 0
// ═══════════════════════════════════════════════════════════════

function biseccion(expr, a, b, tol, maxIter) {
  let fa = evalF(expr, a);
  let fb = evalF(expr, b);

  if (isNaN(fa) || isNaN(fb)) throw new Error('f(a) o f(b) no es evaluable.');
  if (fa * fb > 0) throw new Error(
    `f(a)=${fa.toFixed(4)} y f(b)=${fb.toFixed(4)} tienen el mismo signo. No hay garantía de raíz en [${a}, ${b}].`
  );

  const iters = [];
  let raiz = (a + b) / 2;

  for (let k = 1; k <= maxIter; k++) {
    const c  = (a + b) / 2;
    const fc = evalF(expr, c);
    const err = (b - a) / 2;

    iters.push({ k, a, b, c, fa: evalF(expr,a), fc, err });

    if (Math.abs(fc) < 1e-14 || err < tol) {
      raiz = c;
      return { raiz, iters, converged: true, metodo: 'Bisección' };
    }

    if (fa * fc < 0) { b = c; fb = fc; }
    else             { a = c; fa = fc; }

    raiz = c;
  }

  return { raiz, iters, converged: false, metodo: 'Bisección' };
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 2 — NEWTON-RAPHSON
// x_{n+1} = x_n - f(x_n) / f'(x_n)
// Convergencia: cuadrática (cuando converge)
// ═══════════════════════════════════════════════════════════════

function newtonRaphson(expr, x0, tol, maxIter) {
  let x = x0;
  const iters = [];

  for (let k = 1; k <= maxIter; k++) {
    const fx  = evalF(expr, x);
    const dfx = derivada(expr, x);

    if (isNaN(fx) || isNaN(dfx)) throw new Error(`f(x) o f'(x) no evaluable en x=${x.toFixed(6)}`);
    if (Math.abs(dfx) < 1e-12)  throw new Error(`Derivada ≈ 0 en x=${x.toFixed(6)}. Newton-Raphson no puede continuar.`);

    const xNew = x - fx / dfx;
    const err  = Math.abs(xNew - x);

    iters.push({ k, x, fx, dfx, xNew, err });
    x = xNew;

    if (err < tol) return { raiz: x, iters, converged: true, metodo: 'Newton-Raphson' };
  }

  return { raiz: x, iters, converged: false, metodo: 'Newton-Raphson' };
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 3 — SECANTE
// x_{n+1} = x_n - f(x_n)·(x_n - x_{n-1}) / (f(x_n) - f(x_{n-1}))
// Convergencia: superlineal (~1.618) — no requiere derivada analítica
// ═══════════════════════════════════════════════════════════════

function secante(expr, x0, x1, tol, maxIter) {
  const iters = [];

  for (let k = 1; k <= maxIter; k++) {
    const f0 = evalF(expr, x0);
    const f1 = evalF(expr, x1);

    if (isNaN(f0) || isNaN(f1)) throw new Error(`f no evaluable en x=${x0.toFixed(4)} o x=${x1.toFixed(4)}`);

    const denom = f1 - f0;
    if (Math.abs(denom) < 1e-14) throw new Error('División por cero — f(x₁) ≈ f(x₀). Cambia los puntos iniciales.');

    const x2  = x1 - f1 * (x1 - x0) / denom;
    const err = Math.abs(x2 - x1);

    iters.push({ k, x0, x1, x2, f0, f1, err });
    x0 = x1;
    x1 = x2;

    if (err < tol) return { raiz: x2, iters, converged: true, metodo: 'Secante' };
  }

  return { raiz: x1, iters, converged: false, metodo: 'Secante' };
}

// ═══════════════════════════════════════════════════════════════
// ANÁLISIS DE CONVERGENCIA — ORDEN EMPÍRICO
// Estima el orden de convergencia a partir de los errores
// ═══════════════════════════════════════════════════════════════

function ordenConvergencia(iters, campo = 'err') {
  const errs = iters.map(i => i[campo]).filter(e => e > 1e-15);
  if (errs.length < 3) return null;

  const ratios = [];
  for (let i = 2; i < Math.min(errs.length, 8); i++) {
    const num = Math.log(errs[i] / errs[i-1] + 1e-30);
    const den = Math.log(errs[i-1] / errs[i-2] + 1e-30);
    if (Math.abs(den) > 0.01) ratios.push(num / den);
  }

  if (ratios.length === 0) return null;
  return ratios.reduce((s, v) => s + v, 0) / ratios.length;
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZADO — GRÁFICOS
// ═══════════════════════════════════════════════════════════════

const chartsE = {};
function destroyE(id) {
  if (chartsE[id]) { chartsE[id].destroy(); delete chartsE[id]; }
}

function renderFuncionChart(expr, a, b, raices) {
  destroyE('chartFuncion');
  const ctx = document.getElementById('chartFuncion');
  if (!ctx) return;

  const margen = (b - a) * 0.15;
  const xMin = a - margen, xMax = b + margen;
  const nPts = 400;
  const pts  = Array.from({ length: nPts }, (_, i) => {
    const x = xMin + (i / (nPts - 1)) * (xMax - xMin);
    const y = evalF(expr, x);
    return { x, y: isFinite(y) && Math.abs(y) < 1e6 ? y : null };
  });

  // Datasets de raíces encontradas
  const raizDatasets = raices
    .filter(r => r !== null && isFinite(r))
    .map(r => ({
      label: `Raíz ≈ ${r.toFixed(6)}`,
      data: [{ x: r, y: 0 }],
      type: 'scatter',
      backgroundColor: '#e05252',
      borderColor: '#fff',
      borderWidth: 2,
      pointRadius: 10,
      pointStyle: 'circle'
    }));

  chartsE['chartFuncion'] = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'f(x)',
          data: pts.filter(p => p.y !== null).map(p => ({ x: p.x, y: p.y })),
          borderColor: '#5b9bd5',
          backgroundColor: 'rgba(91,155,213,0.06)',
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0,
          fill: true
        },
        {
          label: 'f(x) = 0',
          data: [{ x: xMin, y: 0 }, { x: xMax, y: 0 }],
          borderColor: '#555c6b',
          borderWidth: 1,
          borderDash: [6, 3],
          pointRadius: 0
        },
        ...raizDatasets
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      parsing: false,
      plugins: {
        legend: { labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } } },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: (${ctx.parsed.x.toFixed(4)}, ${ctx.parsed.y.toFixed(6)})`
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'x', color: '#8b919e' },
          ticks: { color: '#555c6b' },
          grid: { color: '#2a2e38' }
        },
        y: {
          title: { display: true, text: 'f(x)', color: '#8b919e' },
          ticks: { color: '#555c6b' },
          grid: { color: '#2a2e38' }
        }
      }
    }
  });
}

function renderConvergenciaChart(resBis, resNR, resSec) {
  destroyE('chartConvergencia');
  const ctx = document.getElementById('chartConvergencia');
  if (!ctx) return;

  const datasets = [];

  if (resBis?.iters?.length) {
    datasets.push({
      label: 'Bisección',
      data: resBis.iters.map(it => ({ x: it.k, y: Math.max(it.err, 1e-16) })),
      borderColor: '#5b9bd5',
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.1,
      fill: false
    });
  }
  if (resNR?.iters?.length) {
    datasets.push({
      label: 'Newton-Raphson',
      data: resNR.iters.map(it => ({ x: it.k, y: Math.max(it.err, 1e-16) })),
      borderColor: '#4caf82',
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.1,
      fill: false
    });
  }
  if (resSec?.iters?.length) {
    datasets.push({
      label: 'Secante',
      data: resSec.iters.map(it => ({ x: it.k, y: Math.max(it.err, 1e-16) })),
      borderColor: '#e6a817',
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.1,
      fill: false
    });
  }

  chartsE['chartConvergencia'] = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      parsing: false,
      plugins: {
        legend: { labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } } }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Iteración', color: '#8b919e' },
          ticks: { color: '#555c6b' },
          grid: { color: '#2a2e38' }
        },
        y: {
          type: 'logarithmic',
          title: { display: true, text: '|Error| (escala log)', color: '#8b919e' },
          ticks: { color: '#555c6b' },
          grid: { color: '#2a2e38' }
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZADO — TABLAS
// ═══════════════════════════════════════════════════════════════

function renderTablaBiseccion(iters) {
  const tbody = document.getElementById('tablaBisBody');
  if (!tbody) return;

  if (!iters?.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Sin datos</td></tr>';
    return;
  }

  tbody.innerHTML = iters.map((it, idx) => `
    <tr class="${idx === iters.length - 1 ? 'highlight' : ''}">
      <td class="center">${it.k}</td>
      <td class="right">${it.a.toFixed(6)}</td>
      <td class="right">${it.b.toFixed(6)}</td>
      <td class="right">${it.c.toFixed(6)}</td>
      <td class="right">${it.fa.toFixed(6)}</td>
      <td class="right">${it.fc.toFixed(6)}</td>
      <td class="right" style="color:#5b9bd5">${it.err.toExponential(4)}</td>
    </tr>`).join('');
}

function renderTablaNR(iters) {
  const tbody = document.getElementById('tablaNRBody');
  if (!tbody) return;

  if (!iters?.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Sin datos</td></tr>';
    return;
  }

  tbody.innerHTML = iters.map((it, idx) => `
    <tr class="${idx === iters.length - 1 ? 'highlight' : ''}">
      <td class="center">${it.k}</td>
      <td class="right">${it.x.toFixed(8)}</td>
      <td class="right">${it.fx.toFixed(8)}</td>
      <td class="right">${it.dfx.toFixed(6)}</td>
      <td class="right highlight">${it.xNew.toFixed(8)}</td>
      <td class="right" style="color:#4caf82">${it.err.toExponential(4)}</td>
    </tr>`).join('');
}

function renderTablaSecante(iters) {
  const tbody = document.getElementById('tablaSecBody');
  if (!tbody) return;

  if (!iters?.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Sin datos</td></tr>';
    return;
  }

  tbody.innerHTML = iters.map((it, idx) => `
    <tr class="${idx === iters.length - 1 ? 'highlight' : ''}">
      <td class="center">${it.k}</td>
      <td class="right">${it.x0.toFixed(6)}</td>
      <td class="right">${it.x1.toFixed(6)}</td>
      <td class="right">${it.f0.toFixed(6)}</td>
      <td class="right">${it.f1.toFixed(6)}</td>
      <td class="right highlight">${it.x2.toFixed(8)}</td>
      <td class="right" style="color:#e6a817">${it.err.toExponential(4)}</td>
    </tr>`).join('');
}

function renderTablaComparativa(resBis, resNR, resSec, expr) {
  const tbody = document.getElementById('tablaCompEBody');
  if (!tbody) return;

  const fila = (res) => {
    if (!res) return `<tr><td colspan="7" style="opacity:.4">No ejecutado</td></tr>`;
    const orden = ordenConvergencia(res.iters, 'err');
    const fRaiz = evalF(expr, res.raiz);
    const nIter = res.iters.length;
    const lastErr = nIter ? res.iters[nIter-1].err : NaN;
    return `
      <tr>
        <td><strong>${res.metodo}</strong></td>
        <td class="right highlight">${res.raiz.toFixed(8)}</td>
        <td class="right">${fRaiz.toExponential(4)}</td>
        <td class="center">${nIter}</td>
        <td class="right" style="color:${res.converged ? '#4caf82' : '#e05252'}">${lastErr.toExponential(3)}</td>
        <td class="center">${orden !== null ? orden.toFixed(2) : '—'}</td>
        <td class="center">${res.converged
          ? '<span style="color:#4caf82">✓ Sí</span>'
          : '<span style="color:#e05252">✗ No</span>'}</td>
      </tr>`;
  };

  tbody.innerHTML = fila(resBis) + fila(resNR) + fila(resSec);
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL — CALCULAR RAÍCES
// ═══════════════════════════════════════════════════════════════

function calcularRaices() {
  const expr   = document.getElementById('raiz-expr').value.trim();
  const a      = parseFloat(document.getElementById('raiz-a').value);
  const b      = parseFloat(document.getElementById('raiz-b').value);
  const x0nr   = parseFloat(document.getElementById('raiz-x0-nr').value);
  const x0sec  = parseFloat(document.getElementById('raiz-x0-sec').value);
  const x1sec  = parseFloat(document.getElementById('raiz-x1-sec').value);
  const tol    = parseFloat(document.getElementById('raiz-tol').value);
  const maxIter= parseInt(document.getElementById('raiz-maxiter').value);

  if (!expr) { alert('Ingresa una función f(x).'); return; }
  if (isNaN(tol) || tol <= 0) { alert('Tolerancia inválida.'); return; }

  // Limpiar mensajes de error anteriores
  ['err-bis', 'err-nr', 'err-sec'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  let resBis = null, resNR = null, resSec = null;

  // ── Bisección ──
  try {
    resBis = biseccion(expr, a, b, tol, maxIter);
    renderTablaBiseccion(resBis.iters);
    document.getElementById('metrica-bis-raiz').textContent  = resBis.raiz.toFixed(8);
    document.getElementById('metrica-bis-iter').textContent  = resBis.iters.length;
    document.getElementById('metrica-bis-conv').textContent  = resBis.converged ? '✓ Sí' : '✗ No';
    document.getElementById('metrica-bis-conv').style.color  = resBis.converged ? '#4caf82' : '#e05252';
    document.getElementById('metrica-bis-fval').textContent  = evalF(expr, resBis.raiz).toExponential(4);
  } catch (e) {
    const el = document.getElementById('err-bis');
    if (el) { el.textContent = '⚠️ Bisección: ' + e.message; el.style.display = 'block'; }
    renderTablaBiseccion([]);
  }

  // ── Newton-Raphson ──
  try {
    resNR = newtonRaphson(expr, x0nr, tol, maxIter);
    renderTablaNR(resNR.iters);
    document.getElementById('metrica-nr-raiz').textContent  = resNR.raiz.toFixed(8);
    document.getElementById('metrica-nr-iter').textContent  = resNR.iters.length;
    document.getElementById('metrica-nr-conv').textContent  = resNR.converged ? '✓ Sí' : '✗ No';
    document.getElementById('metrica-nr-conv').style.color  = resNR.converged ? '#4caf82' : '#e05252';
    document.getElementById('metrica-nr-fval').textContent  = evalF(expr, resNR.raiz).toExponential(4);
  } catch (e) {
    const el = document.getElementById('err-nr');
    if (el) { el.textContent = '⚠️ Newton-Raphson: ' + e.message; el.style.display = 'block'; }
    renderTablaNR([]);
  }

  // ── Secante ──
  try {
    resSec = secante(expr, x0sec, x1sec, tol, maxIter);
    renderTablaSecante(resSec.iters);
    document.getElementById('metrica-sec-raiz').textContent  = resSec.raiz.toFixed(8);
    document.getElementById('metrica-sec-iter').textContent  = resSec.iters.length;
    document.getElementById('metrica-sec-conv').textContent  = resSec.converged ? '✓ Sí' : '✗ No';
    document.getElementById('metrica-sec-conv').style.color  = resSec.converged ? '#4caf82' : '#e05252';
    document.getElementById('metrica-sec-fval').textContent  = evalF(expr, resSec.raiz).toExponential(4);
  } catch (e) {
    const el = document.getElementById('err-sec');
    if (el) { el.textContent = '⚠️ Secante: ' + e.message; el.style.display = 'block'; }
    renderTablaSecante([]);
  }

  // ── Tabla comparativa y gráficos ──
  renderTablaComparativa(resBis, resNR, resSec, expr);
  renderConvergenciaChart(resBis, resNR, resSec);

  const raices = [
    resBis?.raiz ?? null,
    resNR?.raiz  ?? null,
    resSec?.raiz ?? null
  ].filter(r => r !== null);

  renderFuncionChart(expr, a, b, raices.slice(0, 1)); // mostrar una sola raíz en el gráfico

  // ── Interpretación automática ──
  const mejorRaiz = (resNR?.converged && resNR.raiz) ||
                    (resBis?.converged && resBis.raiz) ||
                    (resSec?.converged && resSec.raiz) || null;

  const presetActual = Object.values(PRESETS_E).find(p => p.expr === expr);

  document.getElementById('raiz-interpretacion').innerHTML = mejorRaiz !== null ? `
    <strong>Raíz encontrada:</strong> x ≈ <strong>${mejorRaiz.toFixed(6)}</strong> &nbsp;·&nbsp;
    f(${mejorRaiz.toFixed(4)}) = ${evalF(expr, mejorRaiz).toExponential(4)} ≈ 0 ✓<br><br>

    ${presetActual ? `<strong>Interpretación del escenario:</strong> ${presetActual.contexto}<br>
    El valor x ≈ <strong>${mejorRaiz.toFixed(4)}</strong> es el umbral crítico —
    ${presetActual === PRESETS_E.vaciado
      ? `el consumo supera al reabastecimiento a partir del <strong>día ${mejorRaiz.toFixed(1)}</strong>.`
      : presetActual === PRESETS_E.costo
        ? `la familia entra en déficit a partir del <strong>día ${mejorRaiz.toFixed(1)}</strong>.`
        : presetActual === PRESETS_E.descontento
          ? `el conflicto social se masifica cuando el índice de escasez supera <strong>${mejorRaiz.toFixed(3)}</strong>.`
          : `el precio de equilibrio del mercado es <strong>${mejorRaiz.toFixed(3)} Bs</strong>.`
    }<br><br>` : ''}

    <strong>Velocidad de convergencia:</strong><br>
    ${resBis?.converged
      ? `• <strong>Bisección</strong>: ${resBis.iters.length} iteraciones · orden p = 1 (lineal) — el error se reduce a la mitad en cada paso. Predecible pero lento.<br>`
      : ''}
    ${resNR?.converged
      ? `• <strong>Newton-Raphson</strong>: ${resNR.iters.length} iteraciones · orden p ≈ 2 (cuadrático) — los dígitos correctos se duplican en cada iteración. El más rápido cuando converge.<br>`
      : ''}
    ${resSec?.converged
      ? `• <strong>Secante</strong>: ${resSec.iters.length} iteraciones · orden p ≈ 1.618 (φ, número áureo) — más rápido que Bisección sin necesitar f'(x).<br>`
      : ''}
    <br>
    ${[resBis, resNR, resSec].filter(r => r?.converged).length > 1
      ? `<strong>Método más eficiente:</strong> ${
          [
            resBis?.converged ? {n:'Bisección', i:resBis.iters.length} : null,
            resNR?.converged  ? {n:'Newton-Raphson', i:resNR.iters.length} : null,
            resSec?.converged ? {n:'Secante', i:resSec.iters.length} : null
          ].filter(Boolean).sort((a,b) => a.i - b.i)[0].n
        } usó menos iteraciones en este caso.<br><br>`
      : ''}
    <strong>Verificación:</strong> Sustituyendo la raíz en f(x):
    f(${mejorRaiz.toFixed(6)}) = ${evalF(expr, mejorRaiz).toExponential(6)} ≈ 0 &nbsp;
    ${Math.abs(evalF(expr, mejorRaiz)) < 1e-6 ? '✓ Verificado correctamente.' : '⚠️ El residuo es alto — puede que no haya convergido.'}
  ` : `
    <span style="color:#e05252">⚠️ Ningún método encontró la raíz con los parámetros actuales.
    Verifica que f(a) y f(b) tengan signos opuestos (Bisección), que el valor inicial esté
    cerca de la raíz (Newton-Raphson), o que los dos puntos iniciales sean distintos y válidos (Secante).</span>
  `;

  document.getElementById('raiz-results').style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

function loadPresetE(key) {
  const p = PRESETS_E[key];
  if (!p) return;
  document.getElementById('raiz-expr').value    = p.expr;
  document.getElementById('raiz-a').value       = p.a;
  document.getElementById('raiz-b').value       = p.b;
  document.getElementById('raiz-x0-nr').value   = p.x0;
  document.getElementById('raiz-x0-sec').value  = p.x0sec;
  document.getElementById('raiz-x1-sec').value  = p.x1sec;
  const desc = document.getElementById('presetDescE');
  if (desc) { desc.textContent = p.desc; desc.style.display = 'block'; }
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

export function init() {
  loadPresetE('vaciado');

  document.getElementById('btnCalcularRaices')?.addEventListener('click', calcularRaices);

  document.getElementById('btnLimpiarRaices')?.addEventListener('click', () => {
    document.getElementById('raiz-results').style.display = 'none';
    Object.keys(chartsE).forEach(k => { chartsE[k]?.destroy(); delete chartsE[k]; });
  });

  document.getElementById('btnPresetE1')?.addEventListener('click',  () => loadPresetE('vaciado'));
  document.getElementById('btnPresetE2')?.addEventListener('click',  () => loadPresetE('costo'));
  document.getElementById('btnPresetE3b')?.addEventListener('click', () => loadPresetE('carburante'));
  document.getElementById('btnPresetE4')?.addEventListener('click',  () => loadPresetE('opinion'));
  document.getElementById('btnPresetE5')?.addEventListener('click',  () => loadPresetE('equilibrio'));

  // Tabs
  document.querySelectorAll('#moduloE .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('#moduloE .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#moduloE .tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('panel-e-' + tab);
      if (panel) panel.classList.add('active');
    });
  });

  console.log('🚀 Escenario E inicializado');
}

if (document.getElementById('btnCalcularRaices')) init();