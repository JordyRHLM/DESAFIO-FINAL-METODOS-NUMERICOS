/* ═══════════════════════════════════════════════════════════════
   ESCENARIO D — Integración Numérica
   Modelo: Costo acumulado y pérdida del poder adquisitivo
   Métodos: Trapecio · Simpson 1/3 · Simpson 3/8
   Bolivia 2026 — Crisis de precios y abastecimiento
═══════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

const PRESETS_D = {
  normal: {
    a: 1, b: 30, n: 30,
    fnStr: 'linear',
    salario: 2500,
    desc: '✅ Mes normal · Inflación leve (función lineal)'
  },
  bloqueo: {
    a: 1, b: 30, n: 30,
    fnStr: 'exponential',
    salario: 2500,
    desc: '🚧 Mes de bloqueo · Inflación exponencial'
  },
  crisis: {
    a: 1, b: 30, n: 60,
    fnStr: 'logistic',
    salario: 2500,
    desc: '🚨 Crisis aguda · Curva logística (sube rápido, se estabiliza)'
  }
};

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE GASTO DIARIO c(t) en Bs/día
// Representan el costo de la canasta básica en función del día
// ═══════════════════════════════════════════════════════════════

const FUNCIONES = {
  linear:      { label: 'Lineal: c(t) = 80 + 1.5t',          fn: t => 80 + 1.5 * t },
  exponential: { label: 'Exponencial: c(t) = 70·e^(0.03t)',   fn: t => 70 * Math.exp(0.03 * t) },
  logistic:    { label: 'Logística: c(t) = 200/(1+8·e^(-0.2t))', fn: t => 200 / (1 + 8 * Math.exp(-0.2 * t)) },
  quadratic:   { label: 'Cuadrática: c(t) = 75 + 0.05t²',    fn: t => 75 + 0.05 * t * t },
  sinusoidal:  { label: 'Sinusoidal: c(t) = 90 + 15·sin(πt/15)', fn: t => 90 + 15 * Math.sin(Math.PI * t / 15) },
};

// ═══════════════════════════════════════════════════════════════
// INTEGRACIÓN NUMÉRICA
// ═══════════════════════════════════════════════════════════════

// ── Regla del Trapecio compuesta ─────────────────────────────
// ∫f dx ≈ h/2 · [f(x₀) + 2f(x₁) + ... + 2f(xₙ₋₁) + f(xₙ)]
// Error: O(h²)
function trapecio(fn, a, b, n) {
  const h = (b - a) / n;
  let suma = fn(a) + fn(b);
  const pasos = [];
  pasos.push({ x: a, fx: fn(a), coef: 1, contrib: fn(a) });
  for (let i = 1; i < n; i++) {
    const xi = a + i * h;
    const fxi = fn(xi);
    suma += 2 * fxi;
    pasos.push({ x: xi, fx: fxi, coef: 2, contrib: 2 * fxi });
  }
  pasos.push({ x: b, fx: fn(b), coef: 1, contrib: fn(b) });
  const resultado = (h / 2) * suma;
  return { resultado, pasos, h, n };
}

// ── Simpson 1/3 compuesto ─────────────────────────────────────
// n debe ser PAR
// ∫f dx ≈ h/3 · [f(x₀) + 4f(x₁) + 2f(x₂) + 4f(x₃) + ... + f(xₙ)]
// Error: O(h⁴)
function simpson13(fn, a, b, n) {
  if (n % 2 !== 0) n += 1; // forzar n par
  const h = (b - a) / n;
  let suma = fn(a) + fn(b);
  const pasos = [];
  pasos.push({ x: a, fx: fn(a), coef: 1, contrib: fn(a) });
  for (let i = 1; i < n; i++) {
    const xi = a + i * h;
    const fxi = fn(xi);
    const coef = i % 2 === 0 ? 2 : 4;
    suma += coef * fxi;
    pasos.push({ x: xi, fx: fxi, coef, contrib: coef * fxi });
  }
  pasos.push({ x: b, fx: fn(b), coef: 1, contrib: fn(b) });
  const resultado = (h / 3) * suma;
  return { resultado, pasos, h, n };
}

// ── Simpson 3/8 compuesto ─────────────────────────────────────
// n debe ser múltiplo de 3
// ∫f dx ≈ 3h/8 · [f(x₀) + 3f(x₁) + 3f(x₂) + 2f(x₃) + ... + f(xₙ)]
// Error: O(h⁴)
function simpson38(fn, a, b, n) {
  if (n % 3 !== 0) n += (3 - (n % 3)); // forzar múltiplo de 3
  const h = (b - a) / n;
  let suma = fn(a) + fn(b);
  const pasos = [];
  pasos.push({ x: a, fx: fn(a), coef: 1, contrib: fn(a) });
  for (let i = 1; i < n; i++) {
    const xi = a + i * h;
    const fxi = fn(xi);
    const coef = i % 3 === 0 ? 2 : 3;
    suma += coef * fxi;
    pasos.push({ x: xi, fx: fxi, coef, contrib: coef * fxi });
  }
  pasos.push({ x: b, fx: fn(b), coef: 1, contrib: fn(b) });
  const resultado = (3 * h / 8) * suma;
  return { resultado, pasos, h, n };
}

// ── Solución analítica exacta ─────────────────────────────────
function exacto(fnStr, a, b) {
  // Antiderivadas conocidas
  if (fnStr === 'linear') {
    // ∫(80 + 1.5t)dt = 80t + 0.75t²
    return (80 * b + 0.75 * b * b) - (80 * a + 0.75 * a * a);
  }
  if (fnStr === 'exponential') {
    // ∫70·e^(0.03t)dt = (70/0.03)·e^(0.03t)
    return (70 / 0.03) * (Math.exp(0.03 * b) - Math.exp(0.03 * a));
  }
  if (fnStr === 'quadratic') {
    // ∫(75 + 0.05t²)dt = 75t + (0.05/3)t³
    return (75 * b + (0.05 / 3) * b ** 3) - (75 * a + (0.05 / 3) * a ** 3);
  }
  // Para logística y sinusoidal usamos integración numérica de alta precisión
  // como referencia (n=10000 pasos)
  return simpson13(FUNCIONES[fnStr].fn, a, b, 10000).resultado;
}

// ── Error relativo ────────────────────────────────────────────
function errRel(aprox, ref) {
  return Math.abs((aprox - ref) / ref) * 100;
}

// ═══════════════════════════════════════════════════════════════
// ANÁLISIS POR SUBINTERVALOS (para tabla de convergencia)
// ═══════════════════════════════════════════════════════════════

function analisisConvergencia(fn, fnStr, a, b) {
  const ns = [2, 4, 6, 10, 20, 30, 60, 100];
  const ref = exacto(fnStr, a, b);
  return ns.map(ni => {
    const rT  = trapecio(fn, a, b, ni).resultado;
    const rS1 = simpson13(fn, a, b, ni % 2 === 0 ? ni : ni + 1).resultado;
    const rS3 = simpson38(fn, a, b, ni % 3 === 0 ? ni : ni + (3 - ni % 3)).resultado;
    return {
      n: ni,
      trap: rT,   errTrap: errRel(rT,  ref),
      s13:  rS1,  errS13:  errRel(rS1, ref),
      s38:  rS3,  errS38:  errRel(rS3, ref),
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZADO — CHARTS
// ═══════════════════════════════════════════════════════════════

const chartsD = {};
function destroyD(id) {
  if (chartsD[id]) { chartsD[id].destroy(); delete chartsD[id]; }
}

// Gráfico de la función y áreas bajo la curva
function renderCurvaGasto(fn, fnLabel, a, b, rTrap, rS13, rS38) {
  destroyD('chartCurvaD');
  const ctx = document.getElementById('chartCurvaD');
  if (!ctx) return;

  const nPts = 300;
  const xs = Array.from({ length: nPts }, (_, i) => a + (i / (nPts - 1)) * (b - a));
  const ys = xs.map(fn);

  chartsD['chartCurvaD'] = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: fnLabel,
          data: xs.map((x, i) => ({ x, y: ys[i] })),
          borderColor: '#c9a84c',
          backgroundColor: 'rgba(201,168,76,0.10)',
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true, parsing: false,
      plugins: {
        legend: { labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } } },
        tooltip: { callbacks: { label: c => ` ${c.parsed.y.toFixed(2)} Bs/día` } }
      },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Día del mes', color: '#8b919e' },
             ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' } },
        y: { title: { display: true, text: 'Gasto diario (Bs)', color: '#8b919e' },
             ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' }, min: 0 }
      }
    }
  });
}

// Gráfico comparativo de los 3 métodos vs exacto
function renderComparacionD(rTrap, rS13, rS38, refExacto) {
  destroyD('chartComparacionD');
  const ctx = document.getElementById('chartComparacionD');
  if (!ctx) return;

  chartsD['chartComparacionD'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Trapecio', 'Simpson 1/3', 'Simpson 3/8', 'Exacto (ref.)'],
      datasets: [{
        label: 'Costo acumulado (Bs)',
        data: [rTrap, rS13, rS38, refExacto],
        backgroundColor: [
          'rgba(91,155,213,0.7)',
          'rgba(76,175,130,0.7)',
          'rgba(230,168,23,0.7)',
          'rgba(201,168,76,0.4)'
        ],
        borderColor: ['#5b9bd5', '#4caf82', '#e6a817', '#c9a84c'],
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } } },
        tooltip: { callbacks: { label: c => ` ${c.parsed.y.toFixed(4)} Bs` } }
      },
      scales: {
        x: { ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' } },
        y: {
          title: { display: true, text: 'Bs acumulados', color: '#8b919e' },
          ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' },
          min: Math.min(rTrap, rS13, rS38, refExacto) * 0.995
        }
      }
    }
  });
}

// Gráfico de convergencia del error
function renderConvergenciaD(convData) {
  destroyD('chartConvergenciaD');
  const ctx = document.getElementById('chartConvergenciaD');
  if (!ctx) return;

  chartsD['chartConvergenciaD'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: convData.map(r => r.n),
      datasets: [
        {
          label: 'Error Trapecio (%)',
          data: convData.map(r => r.errTrap),
          borderColor: '#5b9bd5', backgroundColor: 'transparent',
          borderWidth: 2, pointRadius: 4, tension: 0.2
        },
        {
          label: 'Error Simpson 1/3 (%)',
          data: convData.map(r => r.errS13),
          borderColor: '#4caf82', backgroundColor: 'transparent',
          borderWidth: 2, pointRadius: 4, tension: 0.2
        },
        {
          label: 'Error Simpson 3/8 (%)',
          data: convData.map(r => r.errS38),
          borderColor: '#e6a817', backgroundColor: 'transparent',
          borderWidth: 2, pointRadius: 4, tension: 0.2
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } } } },
      scales: {
        x: { title: { display: true, text: 'Número de subintervalos n', color: '#8b919e' },
             ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' } },
        y: { type: 'logarithmic', title: { display: true, text: 'Error relativo % (log)', color: '#8b919e' },
             ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' } }
      }
    }
  });
}

// Gráfico de poder adquisitivo mensual
function renderPoderAdquisitivo(salario, costoAcum, meses = 6) {
  destroyD('chartPoderAdqD');
  const ctx = document.getElementById('chartPoderAdqD');
  if (!ctx) return;

  // Proyectar: el costo mensual crece, el salario es fijo
  const tasaMensual = (costoAcum - salario) / salario; // puede ser negativo si hay superávit
  const labels = Array.from({ length: meses + 1 }, (_, i) => `Mes ${i}`);
  const costos = labels.map((_, i) => costoAcum * (1 + tasaMensual * i * 0.15));
  const salariosArr = labels.map(() => salario);
  const excedente = costos.map(c => Math.max(0, c - salario));
  const deficit = costos.map(c => Math.max(0, salario - c));

  chartsD['chartPoderAdqD'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Costo mensual proyectado (Bs)',
          data: costos,
          backgroundColor: costos.map((c, i) =>
            i === 0 ? 'rgba(201,168,76,0.6)' : c > salario ? 'rgba(212,95,95,0.6)' : 'rgba(76,175,130,0.6)'),
          borderColor: costos.map((c, i) =>
            i === 0 ? '#c9a84c' : c > salario ? '#d45f5f' : '#4caf82'),
          borderWidth: 2, borderRadius: 4
        },
        {
          label: `Salario mensual (Bs ${salario})`,
          data: salariosArr,
          type: 'line',
          borderColor: '#c9a84c',
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 0,
          fill: false,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } } } },
      scales: {
        x: { ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' } },
        y: { title: { display: true, text: 'Bolivianos (Bs)', color: '#8b919e' },
             ticks: { color: '#555c6b' }, grid: { color: '#2a2e38' }, min: 0 }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZADO — TABLAS
// ═══════════════════════════════════════════════════════════════

function renderTablaPasos(containerId, pasos, metodo, h) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Mostrar máx 20 filas
  const muestra = pasos.length <= 20
    ? pasos
    : pasos.filter((_, i) => i % Math.ceil(pasos.length / 20) === 0 || i === pasos.length - 1);

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th class="center">i</th>
          <th class="right">xᵢ (día)</th>
          <th class="right">f(xᵢ) = c(t)</th>
          <th class="center">Coef.</th>
          <th class="right">Contribución</th>
        </tr>
      </thead>
      <tbody>
        ${muestra.map((p, idx) => `
          <tr>
            <td class="center" style="color:var(--c-text-muted)">${idx}</td>
            <td class="right">${p.x.toFixed(3)}</td>
            <td class="right">${p.fx.toFixed(4)}</td>
            <td class="center" style="color:var(--c-gold); font-family:var(--f-mono)">${p.coef}</td>
            <td class="right highlight">${p.contrib.toFixed(4)}</td>
          </tr>
        `).join('')}
        ${pasos.length > 20 ? `<tr><td colspan="5" class="table-empty" style="font-size:0.75rem">Mostrando ${muestra.length} de ${pasos.length} nodos · h = ${h.toFixed(4)}</td></tr>` : ''}
      </tbody>
    </table>`;
}

function renderTablaConvergencia(convData) {
  const tbody = document.getElementById('tablaConvergenciaBody');
  if (!tbody) return;

  tbody.innerHTML = convData.map(r => `
    <tr>
      <td class="center" style="font-family:var(--f-mono)">${r.n}</td>
      <td class="right">${r.trap.toFixed(4)}</td>
      <td class="right" style="color:${r.errTrap < 0.01 ? 'var(--c-success)' : r.errTrap < 0.1 ? 'var(--c-warning)' : 'var(--c-danger)'}">${r.errTrap.toExponential(3)}%</td>
      <td class="right">${r.s13.toFixed(4)}</td>
      <td class="right" style="color:${r.errS13 < 0.001 ? 'var(--c-success)' : r.errS13 < 0.01 ? 'var(--c-warning)' : 'var(--c-danger)'}">${r.errS13.toExponential(3)}%</td>
      <td class="right">${r.s38.toFixed(4)}</td>
      <td class="right" style="color:${r.errS38 < 0.001 ? 'var(--c-success)' : r.errS38 < 0.01 ? 'var(--c-warning)' : 'var(--c-danger)'}">${r.errS38.toExponential(3)}%</td>
    </tr>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL — INTEGRAR
// ═══════════════════════════════════════════════════════════════

function integrar() {
  const a       = parseFloat(document.getElementById('int-a').value);
  const b       = parseFloat(document.getElementById('int-b').value);
  const n       = parseInt(document.getElementById('int-n').value);
  const fnStr   = document.getElementById('int-fn').value;
  const salario = parseFloat(document.getElementById('int-salario').value);

  // Validaciones
  if (isNaN(a) || isNaN(b) || isNaN(n) || isNaN(salario)) {
    alert('Completa todos los campos correctamente.'); return;
  }
  if (a >= b) { alert('El límite inferior a debe ser menor que b.'); return; }
  if (n < 2)  { alert('El número de subintervalos debe ser al menos 2.'); return; }
  if (!FUNCIONES[fnStr]) { alert('Selecciona una función válida.'); return; }

  const { fn, label } = FUNCIONES[fnStr];
  const ref = exacto(fnStr, a, b);

  // Calcular con los 3 métodos
  const resT  = trapecio(fn, a, b, n);
  const resS1 = simpson13(fn, a, b, n % 2 === 0 ? n : n + 1);
  const resS3 = simpson38(fn, a, b, n % 3 === 0 ? n : n + (3 - n % 3));

  const rT  = resT.resultado;
  const rS1 = resS1.resultado;
  const rS3 = resS3.resultado;

  const dias = b - a;
  const gastoDiarioPromedio = rS1 / dias;
  const porcentajeSalario   = (rS1 / salario) * 100;
  const superavitDeficit    = salario - rS1;
  const mesesHastaQuiebra   = superavitDeficit < 0
    ? Math.abs(salario / superavitDeficit).toFixed(1)
    : '∞';

  // ── Métricas principales ──
  document.getElementById('int-metrics-d').innerHTML = `
    <div class="insight-grid" style="grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));">
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">TRAPECIO · O(h²)</div>
        <div style="font-size:1.3rem; color:#5b9bd5; font-family:var(--f-mono);">${rT.toFixed(2)}</div>
        <div style="font-size:0.7rem; opacity:.5;">Bs acumulados</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">SIMPSON 1/3 · O(h⁴)</div>
        <div style="font-size:1.3rem; color:#4caf82; font-family:var(--f-mono);">${rS1.toFixed(2)}</div>
        <div style="font-size:0.7rem; opacity:.5;">Bs acumulados</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">SIMPSON 3/8 · O(h⁴)</div>
        <div style="font-size:1.3rem; color:#e6a817; font-family:var(--f-mono);">${rS3.toFixed(2)}</div>
        <div style="font-size:0.7rem; opacity:.5;">Bs acumulados</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">EXACTO (referencia)</div>
        <div style="font-size:1.3rem; color:var(--c-gold); font-family:var(--f-mono);">${ref.toFixed(2)}</div>
        <div style="font-size:0.7rem; opacity:.5;">Bs acumulados</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">% DEL SALARIO</div>
        <div style="font-size:1.3rem; color:${porcentajeSalario > 100 ? '#d45f5f' : porcentajeSalario > 80 ? '#e6a817' : '#4caf82'}; font-family:var(--f-mono);">${porcentajeSalario.toFixed(1)}%</div>
        <div style="font-size:0.7rem; opacity:.5;">del salario Bs ${salario}</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">${superavitDeficit >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'} MENSUAL</div>
        <div style="font-size:1.3rem; color:${superavitDeficit >= 0 ? '#4caf82' : '#d45f5f'}; font-family:var(--f-mono);">${Math.abs(superavitDeficit).toFixed(2)}</div>
        <div style="font-size:0.7rem; opacity:.5;">Bs ${superavitDeficit >= 0 ? 'sobrantes' : 'de déficit'}</div>
      </div>
    </div>`;

  // ── Resumen tabla comparativa ──
  document.getElementById('int-resumen').innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Método</th>
          <th class="right">Resultado (Bs)</th>
          <th class="right">n real usado</th>
          <th class="right">h</th>
          <th class="right">Error vs. exacto</th>
          <th class="center">Orden</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Trapecio</td>
          <td class="right" style="color:#5b9bd5">${rT.toFixed(4)}</td>
          <td class="right">${resT.n}</td>
          <td class="right" style="font-family:var(--f-mono)">${resT.h.toFixed(4)}</td>
          <td class="right" style="color:${errRel(rT,ref)<0.1?'var(--c-success)':'var(--c-warning)'}">${errRel(rT,ref).toExponential(3)}%</td>
          <td class="center">O(h²)</td>
        </tr>
        <tr>
          <td>Simpson 1/3</td>
          <td class="right" style="color:#4caf82">${rS1.toFixed(4)}</td>
          <td class="right">${resS1.n}</td>
          <td class="right" style="font-family:var(--f-mono)">${resS1.h.toFixed(4)}</td>
          <td class="right" style="color:${errRel(rS1,ref)<0.001?'var(--c-success)':'var(--c-warning)'}">${errRel(rS1,ref).toExponential(3)}%</td>
          <td class="center">O(h⁴)</td>
        </tr>
        <tr>
          <td>Simpson 3/8</td>
          <td class="right" style="color:#e6a817">${rS3.toFixed(4)}</td>
          <td class="right">${resS3.n}</td>
          <td class="right" style="font-family:var(--f-mono)">${resS3.h.toFixed(4)}</td>
          <td class="right" style="color:${errRel(rS3,ref)<0.001?'var(--c-success)':'var(--c-warning)'}">${errRel(rS3,ref).toExponential(3)}%</td>
          <td class="center">O(h⁴)</td>
        </tr>
        <tr style="background:var(--c-surface-2)">
          <td><strong>Exacto (ref.)</strong></td>
          <td class="right highlight">${ref.toFixed(4)}</td>
          <td class="right" colspan="2" style="color:var(--c-text-muted)">—</td>
          <td class="right">0</td>
          <td class="center">—</td>
        </tr>
      </tbody>
    </table>`;

  // ── Interpretación ──
  const mejorMetodo = errRel(rS1, ref) <= errRel(rS3, ref) ? 'Simpson 1/3' : 'Simpson 3/8';
  document.getElementById('int-interpretacion-d').innerHTML = `
    <div style="margin-bottom:12px;">
      <strong>Costo acumulado del mes (días ${a}–${b}):</strong>
      La familia gasta aproximadamente <strong>Bs ${rS1.toFixed(2)}</strong> en la canasta básica.
      Esto representa el <strong>${porcentajeSalario.toFixed(1)}%</strong> del salario mensual de Bs ${salario}.
    </div>
    <div style="margin-bottom:12px;">
      ${superavitDeficit >= 0
        ? `✓ <strong>El salario cubre el costo:</strong> sobran <strong>Bs ${superavitDeficit.toFixed(2)}</strong> al mes para ahorro o gastos adicionales.`
        : `⚠️ <strong>DÉFICIT:</strong> el costo supera al salario en <strong>Bs ${Math.abs(superavitDeficit).toFixed(2)}</strong>. 
           Con esta trayectoria, los ahorros se agotan en aproximadamente <strong>${mesesHastaQuiebra} meses</strong> si no hay otro ingreso.`
      }
    </div>
    <div style="margin-bottom:12px;">
      <strong>Comparación de métodos:</strong><br>
      • <strong>Trapecio:</strong> error ${errRel(rT, ref).toExponential(3)}% — usa segmentos lineales bajo la curva. Subestima si la función es convexa, sobreestima si es cóncava.<br>
      • <strong>Simpson 1/3:</strong> error ${errRel(rS1, ref).toExponential(3)}% — usa parábolas de ajuste. Convergencia O(h⁴), mucho más preciso que el Trapecio.<br>
      • <strong>Simpson 3/8:</strong> error ${errRel(rS3, ref).toExponential(3)}% — usa polinomios cúbicos. Similar precisión a 1/3, útil cuando n es múltiplo de 3.<br>
      → <strong>${mejorMetodo}</strong> fue el más preciso en este caso con n=${n}.
    </div>`;

  // ── Gráficos ──
  renderCurvaGasto(fn, label, a, b, rT, rS1, rS3);
  renderComparacionD(rT, rS1, rS3, ref);
  const convData = analisisConvergencia(fn, fnStr, a, b);
  renderConvergenciaD(convData);
  renderPoderAdquisitivo(salario, rS1);

  // ── Tablas de pasos ──
  renderTablaPasos('tablaTrapecioBody', resT.pasos, 'Trapecio', resT.h);
  renderTablaPasos('tablaS13Body', resS1.pasos, 'Simpson 1/3', resS1.h);
  renderTablaPasos('tablaS38Body', resS3.pasos, 'Simpson 3/8', resS3.h);
  renderTablaConvergencia(convData);

  // ── Precio constante (sin inflación) ──
  const precioBase = parseFloat(document.getElementById('int-precio-base')?.value) || 80;
  const costoSinInflacion = precioBase * (b - a);
  const perdidaPoder = rS1 - costoSinInflacion;
  const pctPerdida   = (perdidaPoder / costoSinInflacion) * 100;

  const productoMap = {
    papa:   { nombre: '🥔 Papa (arroba)',   impacto: 22 },
    arroz:  { nombre: '🌾 Arroz (kg)',       impacto: 18 },
    aceite: { nombre: '🫙 Aceite (litro)',   impacto: 28 },
    azucar: { nombre: '🍬 Azúcar (kg)',      impacto: 15 },
    pollo:  { nombre: '🍗 Pollo (kg)',       impacto: 35 }
  };
  const prodKey     = document.getElementById('int-producto')?.value || 'aceite';
  const prod        = productoMap[prodKey];

  const sinInflEl = document.getElementById('panel-sin-inflacion-content');
  if (sinInflEl) {
    sinInflEl.innerHTML = `
      <div class="insight-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); margin-bottom:16px;">
        <div class="insight-card">
          <div style="font-size:.7rem;opacity:.6;margin-bottom:4px;">COSTO CON INFLACIÓN</div>
          <div style="font-size:1.4rem;color:#d45f5f;font-family:var(--f-mono);">${rS1.toFixed(2)}</div>
          <div style="font-size:.7rem;opacity:.5;">Bs durante el mes</div>
        </div>
        <div class="insight-card">
          <div style="font-size:.7rem;opacity:.6;margin-bottom:4px;">COSTO SIN INFLACIÓN</div>
          <div style="font-size:1.4rem;color:#4caf82;font-family:var(--f-mono);">${costoSinInflacion.toFixed(2)}</div>
          <div style="font-size:.7rem;opacity:.5;">Bs a precio constante Bs ${precioBase}/día</div>
        </div>
        <div class="insight-card">
          <div style="font-size:.7rem;opacity:.6;margin-bottom:4px;">PÉRDIDA PODER ADQUISITIVO</div>
          <div style="font-size:1.4rem;color:var(--c-gold);font-family:var(--f-mono);">${perdidaPoder.toFixed(2)}</div>
          <div style="font-size:.7rem;opacity:.5;">Bs adicionales gastados (+${pctPerdida.toFixed(1)}%)</div>
        </div>
        <div class="insight-card">
          <div style="font-size:.7rem;opacity:.6;margin-bottom:4px;">PRODUCTO MÁS IMPACTANTE</div>
          <div style="font-size:1.1rem;color:var(--c-gold);font-family:var(--f-mono);">${prod.nombre}</div>
          <div style="font-size:.7rem;opacity:.5;">~${prod.impacto}% del gasto mensual estimado</div>
        </div>
      </div>
      <div class="table-wrapper" style="overflow-x:auto;">
        <table class="table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th class="right">Monto (Bs)</th>
              <th class="right">Diferencia</th>
              <th class="center">Observación</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gasto real con inflación (Simpson 1/3)</td>
              <td class="right" style="color:#d45f5f">${rS1.toFixed(2)}</td>
              <td class="right">—</td>
              <td class="center">Valor calculado</td>
            </tr>
            <tr>
              <td>Gasto hipotético sin inflación</td>
              <td class="right" style="color:#4caf82">${costoSinInflacion.toFixed(2)}</td>
              <td class="right" style="color:#e6a817">+${perdidaPoder.toFixed(2)} Bs</td>
              <td class="center">Precio constante Bs ${precioBase}/día</td>
            </tr>
            <tr>
              <td>Pérdida del poder adquisitivo</td>
              <td class="right highlight">${perdidaPoder.toFixed(2)}</td>
              <td class="right highlight">+${pctPerdida.toFixed(2)}%</td>
              <td class="center">
                ${pctPerdida > 30
                  ? '🔴 Impacto severo'
                  : pctPerdida > 15
                    ? '🟡 Impacto moderado'
                    : '🟢 Impacto leve'}
              </td>
            </tr>
            <tr>
              <td>Salario mensual familiar</td>
              <td class="right">${salario.toFixed(2)}</td>
              <td class="right" style="color:${salario >= rS1 ? '#4caf82' : '#d45f5f'}">
                ${(salario - rS1).toFixed(2)} Bs
              </td>
              <td class="center">${salario >= rS1 ? '✓ Cubre el gasto' : '⚠️ Déficit'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="interp-block" style="margin-top:16px;">
        <div class="interp-block__title">Respuestas del escenario</div>
        <p>
          <strong>¿Cuánto gastó la familia durante el mes?</strong>
          Bs <strong>${rS1.toFixed(2)}</strong> según Simpson 1/3 (método más preciso).
        </p>
        <p>
          <strong>¿Cuánto hubiera gastado si los precios no subían?</strong>
          Bs <strong>${costoSinInflacion.toFixed(2)}</strong> manteniendo Bs ${precioBase}/día constantes.
        </p>
        <p>
          <strong>¿Cuál fue la pérdida del poder adquisitivo?</strong>
          Bs <strong>${perdidaPoder.toFixed(2)}</strong> adicionales, un <strong>${pctPerdida.toFixed(1)}%</strong> más de lo esperado.
        </p>
        <p>
          <strong>¿Qué producto afectó más al gasto?</strong>
          ${prod.nombre} representó aproximadamente el <strong>${prod.impacto}%</strong> del gasto mensual estimado.
        </p>
        <p>
          <strong>¿Qué método fue más preciso?</strong>
          ${errRel(rS1,ref) <= errRel(rS3,ref) ? 'Simpson 1/3' : 'Simpson 3/8'} con error
          ${Math.min(errRel(rS1,ref), errRel(rS3,ref)).toExponential(3)}% respecto al valor exacto.
          El Trapecio tuvo error ${errRel(rT,ref).toExponential(3)}%, confirmando su menor orden O(h²).
        </p>
      </div>`;
  }

  document.getElementById('int-results-d').style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

function loadPresetD(key) {
  const p = PRESETS_D[key];
  if (!p) return;
  document.getElementById('int-a').value       = p.a;
  document.getElementById('int-b').value       = p.b;
  document.getElementById('int-n').value       = p.n;
  document.getElementById('int-fn').value      = p.fnStr;
  document.getElementById('int-salario').value = p.salario;
  const desc = document.getElementById('presetDescD');
  if (desc) { desc.textContent = p.desc; desc.style.display = 'block'; }
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

export function init() {
  loadPresetD('normal');

  document.getElementById('btnIntegrar')?.addEventListener('click', integrar);

  document.getElementById('btnLimpiarD')?.addEventListener('click', () => {
    document.getElementById('int-results-d').style.display = 'none';
    Object.keys(chartsD).forEach(k => { chartsD[k]?.destroy(); delete chartsD[k]; });
  });

  document.getElementById('btnPresetD1')?.addEventListener('click', () => loadPresetD('normal'));
  document.getElementById('btnPresetD2')?.addEventListener('click', () => loadPresetD('bloqueo'));
  document.getElementById('btnPresetD3')?.addEventListener('click', () => loadPresetD('crisis'));

  // Tabs
  document.querySelectorAll('#moduloD .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('#moduloD .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#moduloD .tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('panel-d-' + tab);
      if (panel) panel.classList.add('active');
    });
  });

  console.log('🚀 Escenario D inicializado');
}

if (document.getElementById('btnIntegrar')) init();
