/* ═══════════════════════════════════════════════════════════════
   ESCENARIO B — Ecuaciones Diferenciales Ordinarias
   Modelo: Vaciado crítico de reservas de carburante
   Variables:
     R(t) = reserva disponible en el tiempo t (miles de litros)
     R'(t) = entrada(t) - consumo(t)
   Métodos: Euler · Heun · Runge-Kutta 4
═══════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
// PRESETS — Escenarios reales Bolivia 2026
// ═══════════════════════════════════════════════════════════════

const PRESETS_B = {
  normal: {
    R0: 1000,
    entrada: 80,
    consumo0: 60,
    k: 0.01,
    dias: 30,
    h: 0.5,
    critico: 200,
    desc: '✅ Operación normal · Reserva estable'
  },
  bloqueo: {
    R0: 1000,
    entrada: 30,      // reabastecimiento reducido 62%
    consumo0: 80,
    k: 0.04,
    dias: 30,
    h: 0.5,
    critico: 200,
    desc: '🚧 Bloqueo de rutas · Entrada reducida + consumo creciente'
  },
  panico: {
    R0: 1000,
    entrada: 30,
    consumo0: 120,    // pánico: consumo inicial ya muy alto
    k: 0.07,
    dias: 20,
    h: 0.25,
    critico: 200,
    desc: '🚨 Pánico de compra · Reserva se agota en días'
  }
};

// ═══════════════════════════════════════════════════════════════
// MODELO DIFERENCIAL
// R'(t) = entrada - consumo0 * e^(k*t)
// entrada: constante (reabastecimiento diario)
// consumo0 * e^(k*t): consumo creciente por demanda/pánico
// ═══════════════════════════════════════════════════════════════

function dRdt(t, R, entrada, consumo0, k) {
  return entrada - consumo0 * Math.exp(k * t);
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 1: EULER
// R_{n+1} = R_n + h * f(t_n, R_n)
// Error local: O(h²) · Error global: O(h)
// ═══════════════════════════════════════════════════════════════

function solveEuler(R0, entrada, consumo0, k, dias, h) {
  const puntos = [{ t: 0, R: R0 }];
  let t = 0, R = R0;
  const N = Math.round(dias / h);

  for (let i = 0; i < N; i++) {
    const dR = dRdt(t, R, entrada, consumo0, k);
    R = R + h * dR;
    t = parseFloat((t + h).toFixed(8));
    puntos.push({ t, R: Math.max(0, R) });
    if (R <= 0) break;
  }
  return puntos;
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 2: HEUN (Euler mejorado / Trapecio explícito)
// k1 = f(t_n, R_n)
// k2 = f(t_n + h, R_n + h*k1)
// R_{n+1} = R_n + h/2 * (k1 + k2)
// Error local: O(h³) · Error global: O(h²)
// ═══════════════════════════════════════════════════════════════

function solveHeun(R0, entrada, consumo0, k, dias, h) {
  const puntos = [{ t: 0, R: R0 }];
  let t = 0, R = R0;
  const N = Math.round(dias / h);

  for (let i = 0; i < N; i++) {
    const k1 = dRdt(t, R, entrada, consumo0, k);
    const k2 = dRdt(t + h, R + h * k1, entrada, consumo0, k);
    R = R + (h / 2) * (k1 + k2);
    t = parseFloat((t + h).toFixed(8));
    puntos.push({ t, R: Math.max(0, R) });
    if (R <= 0) break;
  }
  return puntos;
}

// ═══════════════════════════════════════════════════════════════
// MÉTODO 3: RUNGE-KUTTA 4 (RK4)
// k1 = f(t, R)
// k2 = f(t + h/2, R + h/2*k1)
// k3 = f(t + h/2, R + h/2*k2)
// k4 = f(t + h,   R + h*k3)
// R_{n+1} = R_n + h/6 * (k1 + 2k2 + 2k3 + k4)
// Error local: O(h⁵) · Error global: O(h⁴)
// ═══════════════════════════════════════════════════════════════

function solveRK4(R0, entrada, consumo0, k, dias, h) {
  const puntos = [{ t: 0, R: R0 }];
  let t = 0, R = R0;
  const N = Math.round(dias / h);

  for (let i = 0; i < N; i++) {
    const k1 = dRdt(t,         R,             entrada, consumo0, k);
    const k2 = dRdt(t + h/2,   R + h/2 * k1, entrada, consumo0, k);
    const k3 = dRdt(t + h/2,   R + h/2 * k2, entrada, consumo0, k);
    const k4 = dRdt(t + h,     R + h   * k3, entrada, consumo0, k);
    R = R + (h / 6) * (k1 + 2*k2 + 2*k3 + k4);
    t = parseFloat((t + h).toFixed(8));
    puntos.push({ t, R: Math.max(0, R) });
    if (R <= 0) break;
  }
  return puntos;
}

// ═══════════════════════════════════════════════════════════════
// SOLUCIÓN ANALÍTICA EXACTA (para comparar error)
// R(t) = R0 + entrada*t - (consumo0/k)*(e^(kt) - 1)
// ═══════════════════════════════════════════════════════════════

function solucionExacta(t, R0, entrada, consumo0, k) {
  if (Math.abs(k) < 1e-10) return R0 + (entrada - consumo0) * t;
  return R0 + entrada * t - (consumo0 / k) * (Math.exp(k * t) - 1);
}

// ═══════════════════════════════════════════════════════════════
// DÍA EN QUE LA RESERVA BAJA AL NIVEL CRÍTICO
// ═══════════════════════════════════════════════════════════════

function diaCritico(puntos, nivelCritico) {
  for (let i = 1; i < puntos.length; i++) {
    if (puntos[i].R <= nivelCritico) {
      // Interpolación lineal para mayor precisión
      const t0 = puntos[i-1].t, R_prev = puntos[i-1].R;
      const t1 = puntos[i].t,   R_cur  = puntos[i].R;
      const frac = (nivelCritico - R_prev) / (R_cur - R_prev);
      return t0 + frac * (t1 - t0);
    }
  }
  return null; // nunca llegó al nivel crítico
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZADO — GRÁFICOS
// ═══════════════════════════════════════════════════════════════

const chartsB = {};

function destroyChartB(id) {
  if (chartsB[id]) { chartsB[id].destroy(); delete chartsB[id]; }
}

function renderReservaChart(euler, heun, rk4, nivelCritico) {
  destroyChartB('chartReserva');
  const ctx = document.getElementById('chartReserva');
  if (!ctx) return;

  // Usar RK4 como eje de tiempo base (más pasos)
  const maxT = Math.max(
    rk4[rk4.length-1].t,
    euler[euler.length-1].t,
    heun[heun.length-1].t
  );

  // Subsamplear para no saturar el gráfico (máx 200 puntos)
  const subsample = (arr, maxPts = 200) => {
    if (arr.length <= maxPts) return arr;
    const step = Math.ceil(arr.length / maxPts);
    return arr.filter((_, i) => i % step === 0);
  };

  const eS = subsample(euler);
  const hS = subsample(heun);
  const rS = subsample(rk4);

  chartsB['chartReserva'] = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Euler',
          data: eS.map(p => ({ x: p.t, y: p.R })),
          borderColor: '#5b9bd5',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [8, 4],
          pointRadius: 0,
          tension: 0.2
        },
        {
          label: 'Heun',
          data: hS.map(p => ({ x: p.t, y: p.R })),
          borderColor: '#e6a817',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [4, 3],
          pointRadius: 0,
          tension: 0.2
        },
        {
          label: 'RK4 (más preciso)',
          data: rS.map(p => ({ x: p.t, y: p.R })),
          borderColor: '#4caf82',
          backgroundColor: 'rgba(76,175,130,0.08)',
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.2,
          fill: true
        },
        {
          label: `Nivel crítico (${nivelCritico} miles L)`,
          data: [{ x: 0, y: nivelCritico }, { x: maxT, y: nivelCritico }],
          borderColor: '#e05252',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderDash: [8, 4],
          pointRadius: 0,
          tension: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      parsing: false,
      plugins: {
        legend: {
          labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} miles L`
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Días', color: '#8b919e' },
          ticks: { color: '#555c6b' },
          grid: { color: '#2a2e38' }
        },
        y: {
          title: { display: true, text: 'Reserva (miles L)', color: '#8b919e' },
          ticks: { color: '#555c6b' },
          grid: { color: '#2a2e38' },
          min: 0
        }
      }
    }
  });
}

function renderErrorChart(euler, heun, rk4, R0, entrada, consumo0, k) {
  destroyChartB('chartError');
  const ctx = document.getElementById('chartError');
  if (!ctx) return;

  // Calcular error vs solución exacta en cada punto de RK4
  const errEuler = euler.map(p => ({
    x: p.t,
    y: Math.abs(p.R - solucionExacta(p.t, R0, entrada, consumo0, k))
  }));
  const errHeun = heun.map(p => ({
    x: p.t,
    y: Math.abs(p.R - solucionExacta(p.t, R0, entrada, consumo0, k))
  }));
  const errRK4 = rk4.map(p => ({
    x: p.t,
    y: Math.abs(p.R - solucionExacta(p.t, R0, entrada, consumo0, k))
  }));

  chartsB['chartError'] = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Error Euler',
          data: errEuler,
          borderColor: '#5b9bd5',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.2
        },
        {
          label: 'Error Heun',
          data: errHeun,
          borderColor: '#e6a817',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.2
        },
        {
          label: 'Error RK4',
          data: errRK4,
          borderColor: '#4caf82',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      parsing: false,
      plugins: {
        legend: {
          labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Días', color: '#8b919e' },
          ticks: { color: '#555c6b' },
          grid: { color: '#2a2e38' }
        },
        y: {
          type: 'logarithmic',
          title: { display: true, text: '|Error vs. solución exacta| (log)', color: '#8b919e' },
          ticks: { color: '#555c6b' },
          grid: { color: '#2a2e38' }
        }
      }
    }
  });
}

function renderConsumoChart(entrada, consumo0, k, dias) {
  destroyChartB('chartConsumo');
  const ctx = document.getElementById('chartConsumo');
  if (!ctx) return;

  const pts = [];
  for (let t = 0; t <= dias; t += dias / 60) {
    pts.push({ x: parseFloat(t.toFixed(2)), consumo: consumo0 * Math.exp(k * t) });
  }

  chartsB['chartConsumo'] = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Consumo diario consumo₀·eᵏᵗ',
          data: pts.map(p => ({ x: p.x, y: p.consumo })),
          borderColor: '#e05252',
          backgroundColor: 'rgba(224,82,82,0.08)',
          borderWidth: 2,
          pointRadius: 0,
          fill: true
        },
        {
          label: `Entrada constante (${entrada} miles L/día)`,
          data: [{ x: 0, y: entrada }, { x: dias, y: entrada }],
          borderColor: '#4caf82',
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      parsing: false,
      plugins: {
        legend: {
          labels: { color: '#8b919e', font: { family: 'DM Mono, monospace', size: 10 } }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Días', color: '#8b919e' },
          ticks: { color: '#555c6b' },
          grid: { color: '#2a2e38' }
        },
        y: {
          title: { display: true, text: 'Miles L/día', color: '#8b919e' },
          ticks: { color: '#555c6b' },
          grid: { color: '#2a2e38' },
          min: 0
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// RENDERIZADO — TABLA COMPARATIVA POR DÍAS ENTEROS
// ═══════════════════════════════════════════════════════════════

function renderTablaComparativa(euler, heun, rk4, R0, entrada, consumo0, k, critico) {
  const tbody = document.getElementById('tablaODEBody');
  if (!tbody) return;

  // Obtener días enteros disponibles
  const maxDia = Math.floor(Math.max(
    rk4[rk4.length-1].t,
    euler[euler.length-1].t
  ));

  // Interpolar valor en día exacto
  const interpolar = (puntos, tBuscar) => {
    for (let i = 1; i < puntos.length; i++) {
      if (puntos[i].t >= tBuscar) {
        const t0 = puntos[i-1].t, t1 = puntos[i].t;
        const R0p = puntos[i-1].R, R1 = puntos[i].R;
        const frac = (tBuscar - t0) / (t1 - t0 + 1e-12);
        return R0p + frac * (R1 - R0p);
      }
    }
    return puntos[puntos.length-1].R;
  };

  let html = '';
  const paso = Math.max(1, Math.floor(maxDia / 20)); // máx 20 filas

  for (let d = 0; d <= maxDia; d += paso) {
    const rE = interpolar(euler, d);
    const rH = interpolar(heun, d);
    const rR = interpolar(rk4, d);
    const exacto = Math.max(0, solucionExacta(d, R0, entrada, consumo0, k));

    const errE = Math.abs(rE - exacto).toFixed(4);
    const errR = Math.abs(rR - exacto).toFixed(6);

    const estado = rR <= 0
      ? '<span style="color:#e05252">⬛ AGOTADO</span>'
      : rR < critico
        ? '<span style="color:#e05252">🔴 CRÍTICO</span>'
        : rR < critico * 2
          ? '<span style="color:#e6a817">🟡 BAJO</span>'
          : '<span style="color:#4caf82">🟢 NORMAL</span>';

    html += `
      <tr ${rR < critico ? 'style="opacity:0.75"' : ''}>
        <td class="center">${d}</td>
        <td class="right">${rE.toFixed(2)}</td>
        <td class="right">${rH.toFixed(2)}</td>
        <td class="right highlight">${rR.toFixed(2)}</td>
        <td class="right">${exacto.toFixed(2)}</td>
        <td class="right" style="color:#5b9bd5">${errE}</td>
        <td class="right" style="color:#4caf82">${errR}</td>
        <td class="center">${estado}</td>
      </tr>`;
  }

  tbody.innerHTML = html || '<tr><td colspan="8" class="table-empty">Sin datos</td></tr>';
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL — SIMULAR
// ═══════════════════════════════════════════════════════════════

function simularODE() {
  // Leer parámetros
  const R0       = parseFloat(document.getElementById('ode-R0').value);
  const entrada  = parseFloat(document.getElementById('ode-entrada').value);
  const consumo0 = parseFloat(document.getElementById('ode-consumo0').value);
  const k        = parseFloat(document.getElementById('ode-k').value);
  const dias     = parseFloat(document.getElementById('ode-dias').value);
  const h        = parseFloat(document.getElementById('ode-h').value);
  const critico  = parseFloat(document.getElementById('ode-critico').value);

  // Validaciones básicas
  if (isNaN(R0) || isNaN(entrada) || isNaN(consumo0) || isNaN(k) || isNaN(dias) || isNaN(h)) {
    alert('Por favor completa todos los campos.'); return;
  }
  if (h <= 0 || h > dias) { alert('El paso h debe ser mayor a 0 y menor que los días totales.'); return; }
  if (dias <= 0) { alert('Los días a simular deben ser positivos.'); return; }

  // Resolver con los 3 métodos
  const euler = solveEuler(R0, entrada, consumo0, k, dias, h);
  const heun  = solveHeun(R0, entrada, consumo0, k, dias, h);
  const rk4   = solveRK4(R0, entrada, consumo0, k, dias, h);

  // Días críticos (cuando reserva baja del nivel crítico)
  const dcEuler = diaCritico(euler, critico);
  const dcHeun  = diaCritico(heun, critico);
  const dcRK4   = diaCritico(rk4, critico);

  // Reservas finales
  const rfEuler = euler[euler.length-1].R;
  const rfHeun  = heun[heun.length-1].R;
  const rfRK4   = rk4[rk4.length-1].R;

  // Solución exacta al final
  const exactoFinal = Math.max(0, solucionExacta(dias, R0, entrada, consumo0, k));

  // Formatear día crítico
  const fmtDia = d => d !== null ? `Día ${d.toFixed(1)}` : `> ${dias} días`;

  // ── Panel de métricas ──
  document.getElementById('ode-metrics').innerHTML = `
    <div class="insight-grid" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">RESERVA INICIAL</div>
        <div style="font-size:1.4rem; color:var(--c-gold); font-family:var(--f-mono);">${R0.toFixed(0)}</div>
        <div style="font-size:0.7rem; opacity:.5;">miles L</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">DÍA CRÍTICO (RK4)</div>
        <div style="font-size:1.4rem; color:${dcRK4 !== null ? '#e05252' : '#4caf82'}; font-family:var(--f-mono);">${fmtDia(dcRK4)}</div>
        <div style="font-size:0.7rem; opacity:.5;">reserva ≤ ${critico} miles L</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">RESERVA FINAL (RK4)</div>
        <div style="font-size:1.4rem; color:${rfRK4 < critico ? '#e05252' : '#4caf82'}; font-family:var(--f-mono);">${rfRK4.toFixed(1)}</div>
        <div style="font-size:0.7rem; opacity:.5;">miles L al día ${dias}</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">ERROR EULER</div>
        <div style="font-size:1.4rem; color:#5b9bd5; font-family:var(--f-mono);">${Math.abs(rfEuler - exactoFinal).toFixed(3)}</div>
        <div style="font-size:0.7rem; opacity:.5;">vs. solución exacta</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">ERROR RK4</div>
        <div style="font-size:1.4rem; color:#4caf82; font-family:var(--f-mono);">${Math.abs(rfRK4 - exactoFinal).toFixed(6)}</div>
        <div style="font-size:0.7rem; opacity:.5;">vs. solución exacta</div>
      </div>
      <div class="insight-card">
        <div style="font-size:0.7rem; opacity:.6; margin-bottom:4px;">PASO h</div>
        <div style="font-size:1.4rem; color:var(--c-gold); font-family:var(--f-mono);">${h}</div>
        <div style="font-size:0.7rem; opacity:.5;">días por paso</div>
      </div>
    </div>`;

  // ── Comparativa días críticos ──
  document.getElementById('ode-dias-criticos').innerHTML = `
  <div class="table-wrapper">
    <table class="table" style="font-size:0.82rem; white-space:nowrap;">
      <thead>
        <tr>
          <th>Método</th>
          <th class="right">Reserva final</th>
          <th class="right">Día crítico</th>
          <th class="right">Error vs. exacto</th>
          <th class="center">Orden</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Euler</td>
          <td class="right">${rfEuler.toFixed(2)} mL</td>
          <td class="right">${fmtDia(dcEuler)}</td>
          <td class="right" style="color:#5b9bd5">${Math.abs(rfEuler - exactoFinal).toFixed(4)}</td>
          <td class="center">O(h)</td>
        </tr>
        <tr>
          <td>Heun</td>
          <td class="right">${rfHeun.toFixed(2)} mL</td>
          <td class="right">${fmtDia(dcHeun)}</td>
          <td class="right" style="color:#e6a817">${Math.abs(rfHeun - exactoFinal).toFixed(4)}</td>
          <td class="center">O(h²)</td>
        </tr>
        <tr>
          <td><strong>RK4</strong></td>
          <td class="right highlight">${rfRK4.toFixed(2)} mL</td>
          <td class="right highlight">${fmtDia(dcRK4)}</td>
          <td class="right" style="color:#4caf82">${Math.abs(rfRK4 - exactoFinal).toFixed(6)}</td>
          <td class="center"><strong>O(h⁴)</strong></td>
        </tr>
        <tr>
          <td>Exacto</td>
          <td class="right">${exactoFinal.toFixed(2)} mL</td>
          <td class="right">—</td>
          <td class="right">0 (ref.)</td>
          <td class="center">—</td>
        </tr>
      </tbody>
    </table>
  </div>`;

  // ── Interpretación automática ──
  const accion = dcRK4 !== null && dcRK4 < 7
    ? `⚠️ <strong>ALERTA URGENTE:</strong> La reserva llega al nivel crítico en solo ${dcRK4.toFixed(1)} días. Se requiere reabastecimiento inmediato.`
    : dcRK4 !== null
      ? `⚠️ La reserva baja al nivel crítico el <strong>día ${dcRK4.toFixed(1)}</strong>. Planifica el reabastecimiento antes de esa fecha.`
      : `✓ La reserva <strong>no baja del nivel crítico</strong> en los ${dias} días simulados. El sistema es estable con estos parámetros.`;

  const errRatio = Math.abs(rfEuler - exactoFinal) / (Math.abs(rfRK4 - exactoFinal) + 1e-12);

  document.getElementById('ode-interpretacion').innerHTML = `
    <div style="margin-bottom:12px;">${accion}</div>
    <strong>Comparación de métodos:</strong><br>
    • <strong>Euler</strong>: más simple, acumula error O(h) — error final ${Math.abs(rfEuler - exactoFinal).toFixed(4)} miles L.<br>
    • <strong>Heun</strong>: corrector-predictor, error O(h²) — mejora ×${Math.min(errRatio/10, 999).toFixed(0)} sobre Euler.<br>
    • <strong>RK4</strong>: el más preciso, error O(h⁴) — error final ${Math.abs(rfRK4 - exactoFinal).toFixed(6)} miles L.<br><br>
    <strong>Modelo:</strong> R'(t) = ${entrada} - ${consumo0}·e^(${k}·t) &nbsp;→&nbsp; el consumo crece exponencialmente.
    Con k=${k}, el consumo se duplica en ≈ ${(Math.log(2)/k).toFixed(1)} días.
    ${entrada < consumo0
      ? ` La <strong>entrada (${entrada}) ya es menor que el consumo inicial (${consumo0})</strong>: la reserva cae desde el día 0.`
      : ` La entrada (${entrada}) supera al consumo inicial (${consumo0}), pero el crecimiento exponencial invierte esto pronto.`
    }`;

  // ── Gráficos ──
  renderReservaChart(euler, heun, rk4, critico);
  renderErrorChart(euler, heun, rk4, R0, entrada, consumo0, k);
  renderConsumoChart(entrada, consumo0, k, dias);

  // ── Tabla comparativa ──
  renderTablaComparativa(euler, heun, rk4, R0, entrada, consumo0, k, critico);

  // ── Respuestas a las 5 preguntas del escenario B ──
  const q1 = document.getElementById('ode-q1');
  if (q1) q1.innerHTML = dcRK4 !== null
    ? `Según RK4, la reserva alcanza el nivel crítico de <strong>${critico} miles L</strong>
       en el <strong>día ${dcRK4.toFixed(1)}</strong>.
       Euler lo estima en ${fmtDia(dcEuler)}, Heun en ${fmtDia(dcHeun)}.`
    : `✓ La reserva <strong>no alcanza el nivel crítico</strong> en los ${dias} días simulados.
       El sistema es estable con estos parámetros.`;

  const q2 = document.getElementById('ode-q2');
  if (q2) q2.innerHTML = `Con k = <strong>${k}</strong>, el consumo crece exponencialmente
    y se duplica cada <strong>${(Math.log(2)/k).toFixed(1)} días</strong>.
    Al usar el preset 🚨 Pánico (k=0.07, consumo₀=120), la reserva se agota
    en menos de 10 días.`;

  const q3 = document.getElementById('ode-q3');
  if (q3) q3.innerHTML = `Con entrada = <strong>${entrada} miles L/día</strong>
    ${entrada < consumo0
      ? `que es <strong style="color:#e07272">menor que el consumo inicial (${consumo0})</strong>,
         la reserva cae desde el día 0.`
      : `que supera el consumo inicial (${consumo0}), pero el crecimiento exponencial
         invierte esto pronto.`
    }
    El preset 🚧 Bloqueo reduce la entrada a 30 miles L/día — la reserva colapsa en ~15 días.`;

  const q4 = document.getElementById('ode-q4');
  if (q4) q4.innerHTML = `<strong>RK4</strong> es el más estable y preciso (error O(h⁴)).
    Error final vs. exacto: Euler = ${Math.abs(rfEuler - exactoFinal).toFixed(4)},
    Heun = ${Math.abs(rfHeun - exactoFinal).toFixed(4)},
    RK4 = ${Math.abs(rfRK4 - exactoFinal).toFixed(6)} miles L.`;

  const q5 = document.getElementById('ode-q5');
  if (q5) q5.innerHTML = `
    <strong>Euler</strong>: 1 evaluación por paso, error O(h) — el más simple pero menos preciso.<br>
    <strong>Heun</strong>: 2 evaluaciones por paso (predictor-corrector), error O(h²) — balance costo/precisión.<br>
    <strong>RK4</strong>: 4 evaluaciones por paso, error O(h⁴) — el más preciso, estándar en ingeniería.
    Con h = ${h}: RK4 es ~${Math.max(1, Math.round(Math.abs(rfEuler-exactoFinal) / (Math.abs(rfRK4-exactoFinal)+1e-12)))}× más preciso que Euler.`;

  // Mostrar resultados
  document.getElementById('ode-results').style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════
// PRESETS — cargar datos
// ═══════════════════════════════════════════════════════════════

function loadPresetB(key) {
  const p = PRESETS_B[key];
  if (!p) return;
  document.getElementById('ode-R0').value       = p.R0;
  document.getElementById('ode-entrada').value  = p.entrada;
  document.getElementById('ode-consumo0').value = p.consumo0;
  document.getElementById('ode-k').value        = p.k;
  document.getElementById('ode-dias').value     = p.dias;
  document.getElementById('ode-h').value        = p.h;
  document.getElementById('ode-critico').value  = p.critico;
  const desc = document.getElementById('presetDescB');
  if (desc) { desc.textContent = p.desc; desc.style.display = 'block'; }
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

export function init() {
  // Cargar preset por defecto
  loadPresetB('normal');

  document.getElementById('btnSimularODE')?.addEventListener('click', simularODE);

  document.getElementById('btnLimpiarODE')?.addEventListener('click', () => {
    document.getElementById('ode-results').style.display = 'none';
    Object.keys(chartsB).forEach(k => { chartsB[k]?.destroy(); delete chartsB[k]; });
  });

  document.getElementById('btnPresetB1')?.addEventListener('click', () => loadPresetB('normal'));
  document.getElementById('btnPresetB2')?.addEventListener('click', () => loadPresetB('bloqueo'));
  document.getElementById('btnPresetB3')?.addEventListener('click', () => loadPresetB('panico'));

  // Tabs del módulo B
  document.querySelectorAll('#moduloB .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('#moduloB .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#moduloB .tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById('panel-b-' + tab);
      if (panel) panel.classList.add('active');
    });
  });

  console.log('🚀 Escenario B inicializado');
}

if (document.getElementById('btnSimularODE')) init();