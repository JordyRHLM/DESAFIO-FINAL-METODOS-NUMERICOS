/* ═══════════════════════════════════════════════════════════════
   ESCENARIO C — Interpolación Numérica
   Métodos: Lagrange · Newton (Dif. Divididas) · Splines Cúbicos
   Bolivia 2026 — Crisis de desabastecimiento
═══════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

const PRESETS_C = {
  papa: {
    x: [1, 5, 10, 15, 20, 30],
    y: [8, 10, 13, 16, 19, 22],
    producto: 'Papa (arroba)', unidad: 'Bs',
    desc: '🥔 Papa — datos del docente (base del desafío)'
  },
  arroz: {
    x: [1, 7, 14, 21, 28],
    y: [12, 13.5, 16, 19.5, 24],
    producto: 'Arroz (kg)', unidad: 'Bs',
    desc: '🌾 Arroz — subida por bloqueo de rutas del oriente'
  },
  azucar: {
    x: [1, 10, 20, 30],
    y: [6, 7.5, 10, 14],
    producto: 'Azúcar (kg)', unidad: 'Bs',
    desc: '🍬 Azúcar — datos muy dispersos (solo 4 puntos — prueba Runge)'
  },
  aceite: {
    x: [1, 5, 12, 18, 25, 30],
    y: [18, 20, 25, 31, 38, 42],
    producto: 'Aceite (litro)', unidad: 'Bs',
    desc: '🫙 Aceite — mayor incremento porcentual del mes'
  }
};

// ═══════════════════════════════════════════════════════════════
// ALGORITMOS
// ═══════════════════════════════════════════════════════════════

function lagrange(xp, xData, yData) {
  const n = xData.length;
  let result = 0;
  for (let i = 0; i < n; i++) {
    let Li = 1;
    for (let j = 0; j < n; j++) {
      if (j !== i) Li *= (xp - xData[j]) / (xData[i] - xData[j]);
    }
    result += yData[i] * Li;
  }
  return result;
}

function buildDividedDiffTable(xData, yData) {
  const n = xData.length;
  const table = Array.from({ length: n }, (_, i) => Array(n).fill(null));
  for (let i = 0; i < n; i++) table[i][0] = yData[i];
  for (let j = 1; j < n; j++) {
    for (let i = 0; i < n - j; i++) {
      table[i][j] = (table[i + 1][j - 1] - table[i][j - 1]) / (xData[i + j] - xData[i]);
    }
  }
  return table;
}

function newtonEval(xp, xData, ddTable) {
  const n = xData.length;
  let result = ddTable[0][0];
  let prod = 1;
  for (let j = 1; j < n; j++) {
    prod *= (xp - xData[j - 1]);
    result += ddTable[0][j] * prod;
  }
  return result;
}

function buildSpline(xData, yData) {
  const n = xData.length - 1;
  const h = xData.map((x, i) => i < n ? xData[i + 1] - x : 0).slice(0, n);
  const alpha = Array(n + 1).fill(0);
  for (let i = 1; i < n; i++) {
    alpha[i] = (3 / h[i]) * (yData[i + 1] - yData[i])
             - (3 / h[i - 1]) * (yData[i] - yData[i - 1]);
  }
  const l = Array(n + 1).fill(1), mu = Array(n + 1).fill(0), z = Array(n + 1).fill(0);
  for (let i = 1; i < n; i++) {
    l[i]  = 2 * (xData[i + 1] - xData[i - 1]) - h[i - 1] * mu[i - 1];
    mu[i] = h[i] / l[i];
    z[i]  = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
  }
  const c = Array(n + 1).fill(0), b = Array(n).fill(0), d = Array(n).fill(0);
  for (let j = n - 1; j >= 0; j--) {
    c[j] = z[j] - mu[j] * c[j + 1];
    b[j] = (yData[j + 1] - yData[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
    d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
  }
  return { a: yData, b, c: c.slice(0, n), d, x: xData };
}

function evalSpline(sp, xp) {
  const n = sp.x.length - 1;
  let seg = n - 1;
  for (let i = 0; i < n; i++) {
    if (xp <= sp.x[i + 1]) { seg = i; break; }
  }
  const dx = xp - sp.x[seg];
  return sp.a[seg] + sp.b[seg]*dx + sp.c[seg]*dx**2 + sp.d[seg]*dx**3;
}

// ═══════════════════════════════════════════════════════════════
// ANÁLISIS
// ═══════════════════════════════════════════════════════════════

function incrementoPct(yData) {
  const y0 = yData[0], yf = yData[yData.length - 1];
  return ((yf - y0) / y0) * 100;
}

function tasaDiaria(xData, yData) {
  const dias = xData[xData.length - 1] - xData[0];
  if (dias === 0) return 0;
  return incrementoPct(yData) / dias;
}
function mayorSubida(xData, yData) {
  let maxDiff = -Infinity, idx = 0;
  for (let i = 1; i < yData.length; i++) {
    const diff = yData[i] - yData[i - 1];
    if (diff > maxDiff) { maxDiff = diff; idx = i; }
  }
  return { desde: xData[idx - 1], hasta: xData[idx], subida: maxDiff };
}

// ═══════════════════════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════════════════════

const chartsC = {};
function destroyC(id) {
  if (chartsC[id]) { chartsC[id].destroy(); delete chartsC[id]; }
}

const CHART_OPTS_BASE = {
  responsive: true, maintainAspectRatio: true, parsing: false,
  plugins: { legend: { labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } } } }
};

function renderCurvaPrecios(xData, yData, sp, ddTable, producto, unidad, xEval) {
  destroyC('chartCurva');
  const ctx = document.getElementById('chartCurva');
  if (!ctx) return;
  const xMin = xData[0], xMax = xData[xData.length - 1];
  const xs = Array.from({ length: 300 }, (_, i) => xMin + (i / 299) * (xMax - xMin));
  const yEvalSpl = evalSpline(sp, xEval);

  chartsC['chartCurva'] = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        { label: 'Lagrange', data: xs.map((x,i)=>({x,y:lagrange(x,xData,yData)})),
          borderColor:'#5b9bd5', borderWidth:2, borderDash:[5,3], pointRadius:0, tension:0, fill:false },
        { label: 'Newton',   data: xs.map((x,i)=>({x,y:newtonEval(x,xData,ddTable)})),
          borderColor:'#e6a817', borderWidth:1.5, borderDash:[3,2], pointRadius:0, tension:0, fill:false },
        { label: 'Spline Cúbico', data: xs.map((x,i)=>({x,y:evalSpline(sp,x)})),
          borderColor:'#4caf82', borderWidth:2.5, pointRadius:0, tension:0, fill:false },
        { label: 'Datos reales', data: xData.map((x,i)=>({x,y:yData[i]})),
          type:'scatter', backgroundColor:'#c9a84c', borderColor:'#c9a84c', pointRadius:7 },
        { label: `Estimación día ${xEval}`, data:[{x:xEval, y:yEvalSpl}],
          type:'scatter', backgroundColor:'#e05252', borderColor:'#fff',
          borderWidth:2, pointRadius:9, pointStyle:'triangle' }
      ]
    },
    options: {
      ...CHART_OPTS_BASE,
      plugins: { ...CHART_OPTS_BASE.plugins,
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y.toFixed(3)} ${unidad}` } }
      },
      scales: {
        x: { type:'linear', title:{display:true,text:'Día del mes',color:'#8b919e'},
             ticks:{color:'#555c6b'}, grid:{color:'#2a2e38'} },
        y: { title:{display:true,text:`Precio (${unidad})`,color:'#8b919e'},
             ticks:{color:'#555c6b'}, grid:{color:'#2a2e38'}, min:0 }
      }
    }
  });
}

function renderOscilacionChart(xData, yData, sp) {
  destroyC('chartOscilacion');
  const ctx = document.getElementById('chartOscilacion');
  if (!ctx) return;
  const xMin = xData[0], xMax = xData[xData.length - 1];
  const xs = Array.from({ length: 300 }, (_, i) => xMin + (i / 299) * (xMax - xMin));
  const diff = xs.map(x => Math.abs(lagrange(x, xData, yData) - evalSpline(sp, x)));

  chartsC['chartOscilacion'] = new Chart(ctx, {
    type: 'line',
    data: { datasets: [{
      label: '|Lagrange − Spline|',
      data: xs.map((x,i)=>({x,y:diff[i]})),
      borderColor:'#e05252', backgroundColor:'rgba(224,82,82,0.08)',
      borderWidth:1.5, pointRadius:0, fill:true
    }] },
    options: {
      ...CHART_OPTS_BASE,
      scales: {
        x: { type:'linear', title:{display:true,text:'Día',color:'#8b919e'},
             ticks:{color:'#555c6b'}, grid:{color:'#2a2e38'} },
        y: { title:{display:true,text:'Diferencia (Bs)',color:'#8b919e'},
             ticks:{color:'#555c6b'}, grid:{color:'#2a2e38'}, min:0 }
      }
    }
  });
}

function renderComparativaProductos() {
  destroyC('chartComparativaProductos');
  const ctx   = document.getElementById('chartComparativaProductos');
  const tbody = document.getElementById('tablaComparativaProductos');
  if (!ctx || !tbody) return;

  const productos = Object.entries(PRESETS_C).map(([key, p]) => {
    const y0  = p.y[0];
    const yf  = p.y[p.y.length - 1];
    const pct = ((yf - y0) / y0) * 100;              // ← cálculo directo, no llamar incrementoPct
    const dias = p.x[p.x.length - 1] - p.x[0];
    const tasa = pct / dias;
    return { key, nombre: p.producto, y0, yf, pct, tasa };
  });

  productos.sort((a, b) => b.pct - a.pct);

  tbody.innerHTML = productos.map((p, i) => {
    const impacto = p.pct > 100 ? `<span style="color:#e05252">🔴 Crítico</span>`
                  : p.pct > 50  ? `<span style="color:#e6a817">🟡 Alto</span>`
                  : p.pct > 20  ? `<span style="color:#c9a84c">🟠 Moderado</span>`
                  :               `<span style="color:#4caf82">🟢 Leve</span>`;
    const medal = i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '';
    return `
      <tr>
        <td><strong>${medal}${p.nombre}</strong></td>
        <td class="right">${p.y0.toFixed(2)} Bs</td>
        <td class="right">${p.yf.toFixed(2)} Bs</td>
        <td class="right highlight">${p.pct.toFixed(1)}%</td>
        <td class="right">${p.tasa.toFixed(3)}%/día</td>
        <td class="center">${impacto}</td>
      </tr>`;
  }).join('');

  const colores = productos.map(p =>
    p.pct > 100 ? 'rgba(212,95,95,0.75)'   :
    p.pct > 50  ? 'rgba(230,168,23,0.75)'  :
    p.pct > 20  ? 'rgba(201,168,76,0.75)'  :
                  'rgba(76,175,130,0.75)');

  const bordes = productos.map(p =>
    p.pct > 100 ? '#d45f5f' : p.pct > 50 ? '#e6a817' :
    p.pct > 20  ? '#c9a84c' : '#4caf82');

  chartsC['chartComparativaProductos'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: productos.map(p => p.nombre),
      datasets: [{
        label: 'Incremento % en el mes',
        data: productos.map(p => parseFloat(p.pct.toFixed(2))),  // ← valores reales ej: 175, 133
        backgroundColor: colores,
        borderColor: bordes,
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } }
        },
        tooltip: {
          callbacks: { label: c => ` ${c.parsed.y.toFixed(1)}% de incremento` }
        }
      },
      scales: {
        x: {
          ticks: { color: '#555c6b', font: { family: 'DM Mono, monospace', size: 10 } },
          grid: { color: '#2a2e38' }
        },
        y: {
          title: { display: true, text: 'Incremento (%)', color: '#8b919e' },
          ticks: { color: '#555c6b', callback: v => v + '%' },
          grid: { color: '#2a2e38' },
          min: 0,
          suggestedMax: Math.max(...productos.map(p => p.pct)) * 1.15
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// TABLAS
// ═══════════════════════════════════════════════════════════════

function renderTablaDiferencias(xData, ddTable) {
  const tbody = document.getElementById('tablaDDBody');
  const thead = document.getElementById('tablaDDHead');
  if (!tbody || !thead) return;
  const n = xData.length;
  let headHtml = '<tr><th>xᵢ</th><th>f[xᵢ]</th>';
  for (let j = 1; j < n; j++) headHtml += `<th class="right">Δ${j}</th>`;
  thead.innerHTML = headHtml + '</tr>';
  let bodyHtml = '';
  for (let i = 0; i < n; i++) {
    bodyHtml += `<tr><td class="highlight">${xData[i]}</td>`;
    for (let j = 0; j < n; j++) {
      const val = ddTable[i][j];
      bodyHtml += val !== null
        ? `<td class="right">${val.toFixed(5)}</td>`
        : '<td style="opacity:.25; text-align:right">—</td>';
    }
    bodyHtml += '</tr>';
  }
  tbody.innerHTML = bodyHtml;
}

function renderTablaCoefSpline(sp, xData) {
  const tbody = document.getElementById('tablaSplineBody');
  if (!tbody) return;
  const n = xData.length - 1;
  tbody.innerHTML = Array.from({ length: n }, (_, i) => `
    <tr>
      <td class="center">[${xData[i]}, ${xData[i+1]}]</td>
      <td class="right">${sp.a[i].toFixed(5)}</td>
      <td class="right">${sp.b[i].toFixed(5)}</td>
      <td class="right">${sp.c[i].toFixed(5)}</td>
      <td class="right">${sp.d[i].toFixed(5)}</td>
    </tr>`).join('');
}

function renderTablaEstimaciones(xData, yData, sp, ddTable, unidad) {
  const tbody = document.getElementById('tablaEstimBody');
  if (!tbody) return;
  const diasSinDato = [];
  for (let d = xData[0]; d <= xData[xData.length-1]; d++) {
    if (!xData.includes(d)) diasSinDato.push(d);
  }
  const muestra = diasSinDato.filter((_, i) => i % Math.ceil(diasSinDato.length / 15) === 0);
  if (muestra.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No hay días sin dato en el rango</td></tr>';
    return;
  }
  tbody.innerHTML = muestra.map(d => {
    const yL = lagrange(d, xData, yData);
    const yN = newtonEval(d, xData, ddTable);
    const yS = evalSpline(sp, d);
    const diff = Math.abs(yL - yS);
    const conf = diff < 0.5 ? '🟢 Alta' : diff < 2 ? '🟡 Media' : '🔴 Baja';
    return `
      <tr>
        <td class="center">${d}</td>
        <td class="right">${yL.toFixed(3)}</td>
        <td class="right">${yN.toFixed(3)}</td>
        <td class="right highlight">${yS.toFixed(3)}</td>
        <td class="right" style="color:#5b9bd5">${diff.toFixed(4)}</td>
        <td class="center">${conf}</td>
      </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// RESPUESTAS A LAS 5 PREGUNTAS
// ═══════════════════════════════════════════════════════════════

function renderRespuestasC(xOrd, yOrd, sp, ddTable, xEval, yLag, ySpl, difLagSpl, producto, unidad) {
  const pct  = incrementoPct(yOrd);
  const tasa = tasaDiaria(xOrd, yOrd);
  const ms   = mayorSubida(xOrd, yOrd);

  // Q1 — precio en día sin dato
  const q1 = document.getElementById('cq1');
  if (q1) q1.innerHTML = `
    El precio estimado del <strong>${producto}</strong> en el día <strong>${xEval}</strong> es:<br>
    Lagrange = <strong>${yLag.toFixed(3)} ${unidad}</strong> ·
    Spline = <strong>${ySpl.toFixed(3)} ${unidad}</strong>.
    ${!xOrd.includes(xEval)
      ? ' Este día no tiene dato real — la interpolación lo estima con alta confianza.'
      : ' Este día coincide con un dato real, confirma que el método es correcto.'}`;

  // Q2 — comportamiento curva
  const q2 = document.getElementById('cq2');
  if (q2) q2.innerHTML = `
    La curva muestra una tendencia <strong>${pct > 0 ? 'alcista' : 'bajista'}</strong> sostenida.
    El mayor salto ocurre del día <strong>${ms.desde}</strong> al <strong>${ms.hasta}</strong>
    (+${ms.subida.toFixed(2)} ${unidad} en ${ms.hasta - ms.desde} días).
    Tasa media: <strong>${tasa.toFixed(3)}% por día</strong>.`;

  // Q3 — mayor incremento
  const todos = Object.values(PRESETS_C).map(p => ({
    nombre: p.producto, pct: incrementoPct(p.y)
  })).sort((a,b) => b.pct - a.pct);
  const q3 = document.getElementById('cq3');
  if (q3) q3.innerHTML = `
    Según los datos disponibles, el producto con mayor incremento es
    <strong>${todos[0].nombre}</strong> con un <strong>${todos[0].pct.toFixed(1)}%</strong>
    de aumento en el mes. Ve al tab <strong>Comparativa</strong> para el ranking completo.`;

  // Q4 — confiabilidad
  const q4 = document.getElementById('cq4');
  if (q4) {
    const nivelConf = difLagSpl < 0.1 ? 'MUY ALTA' : difLagSpl < 0.5 ? 'ALTA' :
                      difLagSpl < 2   ? 'MEDIA'    : 'BAJA (fenómeno de Runge detectado)';
    const colorConf = difLagSpl < 0.5 ? '#4caf82' : difLagSpl < 2 ? '#e6a817' : '#e05252';
    q4.innerHTML = `
      Confiabilidad: <strong style="color:${colorConf}">${nivelConf}</strong>.
      La diferencia |Lagrange − Spline| = <strong>${difLagSpl.toFixed(4)}</strong>.
      ${difLagSpl > 2
        ? ' El polinomio de Lagrange oscila en los extremos. El Spline cúbico es más confiable.'
        : ' Los tres métodos coinciden — los datos son suficientemente regulares.'}`;
  }

  // Q5 — datos dispersos
  const q5 = document.getElementById('cq5');
  if (q5) q5.innerHTML = `
    Con datos muy dispersos (ej. Azúcar: solo 4 puntos),
    Lagrange genera un polinomio de grado 3 que puede oscilar fuertemente entre nodos.
    El Spline cúbico divide el intervalo en ${xOrd.length - 1} segmentos de menor grado,
    evitando las oscilaciones. A mayor dispersión de datos,
    <strong>mayor diferencia entre Lagrange y Spline</strong> — usa el tab
    <strong>Oscilación Runge</strong> para visualizarlo.`;
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════

function interpolar() {
  const xStr     = document.getElementById('int-x').value.trim();
  const yStr     = document.getElementById('int-y').value.trim();
  const xEval    = parseFloat(document.getElementById('int-xeval').value);
  const producto = document.getElementById('int-producto').value.trim() || 'Producto';
  const unidad   = document.getElementById('int-unidad').value.trim() || 'Bs';

  const xData = xStr.split(',').map(Number);
  const yData = yStr.split(',').map(Number);

  if (xData.length < 2 || yData.length < 2) { alert('Se necesitan al menos 2 puntos.'); return; }
  if (xData.length !== yData.length) { alert('Cantidad de x e y debe coincidir.'); return; }
  if (xData.some(isNaN) || yData.some(isNaN)) { alert('Solo números separados por coma.'); return; }

  const pares = xData.map((x, i) => ({ x, y: yData[i] })).sort((a, b) => a.x - b.x);
  const xOrd  = pares.map(p => p.x);
  const yOrd  = pares.map(p => p.y);

  const xMin = xOrd[0], xMax = xOrd[xOrd.length - 1];
  const fueraRango = xEval < xMin || xEval > xMax;

  const ddTable = buildDividedDiffTable(xOrd, yOrd);
  const sp      = buildSpline(xOrd, yOrd);

  const yLag = lagrange(xEval, xOrd, yOrd);
  const yNew = newtonEval(xEval, xOrd, ddTable);
  const ySpl = xOrd.length >= 3 ? evalSpline(sp, xEval) : yLag;

  const difLagNew = Math.abs(yLag - yNew);
  const difLagSpl = Math.abs(yLag - ySpl);
  const pct       = incrementoPct(yOrd);
  const tasa      = tasaDiaria(xOrd, yOrd);
  const ms        = mayorSubida(xOrd, yOrd);

  // ── Métricas ──
  document.getElementById('int-metrics').innerHTML = `
    <div class="insight-grid" style="grid-template-columns: repeat(auto-fit, minmax(155px,1fr));">
      <div class="insight-card">
        <div style="font-size:0.7rem;opacity:.6;margin-bottom:4px;">LAGRANGE · día ${xEval}</div>
        <div style="font-size:1.4rem;color:#5b9bd5;font-family:var(--f-mono);">${yLag.toFixed(3)}</div>
        <div style="font-size:0.7rem;opacity:.5;">${unidad}</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem;opacity:.6;margin-bottom:4px;">NEWTON · día ${xEval}</div>
        <div style="font-size:1.4rem;color:#e6a817;font-family:var(--f-mono);">${yNew.toFixed(3)}</div>
        <div style="font-size:0.7rem;opacity:.5;">${unidad}</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem;opacity:.6;margin-bottom:4px;">SPLINE · día ${xEval}</div>
        <div style="font-size:1.4rem;color:#4caf82;font-family:var(--f-mono);">${ySpl.toFixed(3)}</div>
        <div style="font-size:0.7rem;opacity:.5;">${unidad} · más estable</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem;opacity:.6;margin-bottom:4px;">INCREMENTO TOTAL</div>
        <div style="font-size:1.4rem;color:var(--c-gold);font-family:var(--f-mono);">${pct.toFixed(1)}%</div>
        <div style="font-size:0.7rem;opacity:.5;">días ${xOrd[0]}–${xOrd[xOrd.length-1]}</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem;opacity:.6;margin-bottom:4px;">|Lag − Newton|</div>
        <div style="font-size:1.4rem;color:${difLagNew < 0.001?'#4caf82':'#e05252'};font-family:var(--f-mono);">${difLagNew.toExponential(2)}</div>
        <div style="font-size:0.7rem;opacity:.5;">debe ser ≈ 0</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem;opacity:.6;margin-bottom:4px;">|Lag − Spline|</div>
        <div style="font-size:1.4rem;color:${difLagSpl < 1?'#4caf82':'#e6a817'};font-family:var(--f-mono);">${difLagSpl.toFixed(4)}</div>
        <div style="font-size:0.7rem;opacity:.5;">oscilación Runge</div>
      </div>
    </div>
    ${fueraRango ? `<div class="alert alert-warning" style="margin-top:12px;">
      ⚠️ x=${xEval} está fuera del rango [${xMin}, ${xMax}] — es una <strong>extrapolación</strong>, menos confiable.
    </div>` : ''}`;

  // ── Análisis ──
  document.getElementById('int-analisis').innerHTML = `
    <div class="insight-grid">
      <div class="insight-card">
        <div class="insight-card__icon">📈</div>
        <div class="insight-card__title">Mayor subida registrada</div>
        <p>Del día <strong>${ms.desde}</strong> al <strong>${ms.hasta}</strong>:
        +<strong>${ms.subida.toFixed(2)} ${unidad}</strong> en ${ms.hasta - ms.desde} días.</p>
      </div>
      <div class="insight-card">
        <div class="insight-card__icon">📊</div>
        <div class="insight-card__title">Tasa media diaria</div>
        <p><strong>${tasa.toFixed(3)}% por día</strong> de incremento promedio durante el mes.</p>
      </div>
      <div class="insight-card">
        <div class="insight-card__icon">🔍</div>
        <div class="insight-card__title">Confiabilidad</div>
        <p>${difLagSpl < 0.5
          ? '✓ <strong>Alta</strong>: Lagrange y Spline coinciden bien.'
          : difLagSpl < 2
            ? '⚠️ <strong>Media</strong>: ligera oscilación de Lagrange.'
            : '⚠️ <strong>Baja</strong>: fenómeno de Runge presente. Usa el Spline.'}</p>
      </div>
      <div class="insight-card">
        <div class="insight-card__icon">💰</div>
        <div class="insight-card__title">Estimación día ${xEval}</div>
        <p>Spline: <strong>${ySpl.toFixed(2)} ${unidad}</strong><br>
        ${ySpl > yOrd[yOrd.length-1] ? '📈 Sobre el último dato.' :
          ySpl < yOrd[0] ? '📉 Bajo el primer dato.' : '✓ Dentro del rango histórico.'}</p>
      </div>
    </div>`;

  // ── Interpretación texto ──
  document.getElementById('int-interpretacion').innerHTML = `
    <strong>Resultado en día ${xEval}:</strong>
    Lagrange = <strong>${yLag.toFixed(3)} ${unidad}</strong> ·
    Newton = <strong>${yNew.toFixed(3)} ${unidad}</strong> ·
    Spline = <strong>${ySpl.toFixed(3)} ${unidad}</strong><br><br>
    <strong>Lagrange vs Newton:</strong> diferencia ${difLagNew.toExponential(2)} —
    ${difLagNew < 1e-8 ? 'idénticos ✓ (algebraicamente equivalentes).'
      : 'diferencia numérica mínima por redondeo de punto flotante.'}<br><br>
    <strong>Spline cúbico:</strong> divide en ${xOrd.length-1} segmentos con polinomios cúbicos,
    garantizando continuidad C². Evita oscilaciones de Runge en datos dispersos.<br><br>
    <strong>Incremento del ${producto}:</strong> ${pct.toFixed(1)}% en
    ${xOrd[xOrd.length-1] - xOrd[0]} días (${tasa.toFixed(3)}%/día promedio).
    ${pct > 50 ? ' <strong>⚠️ Inflación severa del producto.</strong>'
      : pct > 20 ? ' ⚠️ Incremento significativo.' : ' Incremento moderado.'}`;

  // ── Gráficos y tablas ──
  renderCurvaPrecios(xOrd, yOrd, sp, ddTable, producto, unidad, xEval);
  renderOscilacionChart(xOrd, yOrd, sp);
  renderTablaDiferencias(xOrd, ddTable);
  renderTablaCoefSpline(sp, xOrd);
  renderTablaEstimaciones(xOrd, yOrd, sp, ddTable, unidad);
  renderComparativaProductos();

  // ── 5 preguntas ──
  renderRespuestasC(xOrd, yOrd, sp, ddTable, xEval, yLag, ySpl, difLagSpl, producto, unidad);

  document.getElementById('int-results').style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════

function loadPresetC(key) {
  const p = PRESETS_C[key];
  if (!p) return;
  document.getElementById('int-x').value        = p.x.join(',');
  document.getElementById('int-y').value        = p.y.join(',');
  document.getElementById('int-producto').value = p.producto;
  document.getElementById('int-unidad').value   = p.unidad;
  const desc = document.getElementById('presetDescC');
  if (desc) { desc.textContent = p.desc; desc.style.display = 'block'; }
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

export function init() {
  loadPresetC('papa');
  document.getElementById('btnInterpolar')?.addEventListener('click', interpolar);
  document.getElementById('btnLimpiarInt')?.addEventListener('click', () => {
    document.getElementById('int-results').style.display = 'none';
    Object.keys(chartsC).forEach(k => { chartsC[k]?.destroy(); delete chartsC[k]; });
  });
  document.getElementById('btnPresetC1')?.addEventListener('click', () => loadPresetC('papa'));
  document.getElementById('btnPresetC2')?.addEventListener('click', () => loadPresetC('arroz'));
  document.getElementById('btnPresetC3')?.addEventListener('click', () => loadPresetC('azucar'));
  document.getElementById('btnPresetC4')?.addEventListener('click', () => loadPresetC('aceite'));

  document.querySelectorAll('#moduloC .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('#moduloC .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#moduloC .tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-c-' + tab)?.classList.add('active');
    });
  });

  console.log('🚀 Escenario C inicializado');
}

if (document.getElementById('btnInterpolar')) init();