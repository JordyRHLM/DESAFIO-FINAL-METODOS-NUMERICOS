# Simulación Numérica de Crisis
# El Colapso en Ecuaciones: Modelado numérico de la crisis boliviana
### Abastecimiento, Precios y Conflicto Social en Bolivia

**Desafío Final – Métodos Numéricos | UMSA**

---

## Estructura del proyecto

```
DESAFIO-FINAL-METODOS-NUMERICOS/
│
├── index.html                            # Shell principal (navbar + router SPA)
│
├── pages/                                # Una página HTML por sección
│   ├── inicio.html                       # Presentación del problema y contexto
│   ├── escenario-a.html                  # Módulo A: Sistemas de ecuaciones lineales
│   ├── escenario-b.html                  # Módulo B: Ecuaciones diferenciales (ODE)
│   ├── escenario-c.html                  # Módulo C: Interpolación
│   ├── escenario-d.html                  # Módulo D: Integración numérica
│   ├── escenario-e.html                  # Módulo E: Raíces de ecuaciones
│   └── conclusiones.html                 # Conclusiones y limitaciones del modelo
│
├── css/
│   ├── main.css                          # Variables globales, reset, layout, tipografía
│   ├── components.css                    # Tarjetas, botones, tablas, formularios, badges
│   └── responsive.css                    # Media queries (mobile, tablet, desktop)
│
└── js/
    ├── app.js                            # Router SPA: carga páginas sin recargar
    │
    ├── components/                       # Archivos reservados (vacíos por ahora)
    │   ├── navbar.js
    │   ├── footer.js
    │   └── loader.js
    │
    ├── modules/                          # Lógica numérica por escenario
    │   ├── escenario-a-sistemas.js       # LU, Jacobi, Gauss-Seidel, SOR, Grad. Conjugado
    │   ├── escenario-b-ode.js            # Euler, Heun, RK4
    │   ├── escenario-c-interpolacion.js  # Lagrange, Newton, Splines cúbicos
    │   ├── escenario-d-integracion.js    # Trapecio, Simpson 1/3, Simpson 3/8
    │   └── escenario-e-raices.js         # Bisección, Newton-Raphson, Secante
    │
    └── utils/                            # Archivos reservados (vacíos por ahora)
        ├── math-helpers.js
        ├── chart-helpers.js
        └── ui-helpers.js
```

---

## Escenarios implementados

| # | Escenario | Métodos numéricos | Contexto |
|---|-----------|-------------------|----------|
| A | Optimización de red de distribución | LU, Jacobi, Gauss-Seidel, SOR, Gradiente Conjugado | Distribución de carburante desde 3 plantas hacia 3 zonas bajo bloqueo |
| B | Vaciado crítico de reservas de carburante | Euler, Heun, RK4 | Modelo R'(t) = entrada − consumo₀·eᵏᵗ con consumo exponencial por pánico |
| C | Curva continua de precios de alimentos | Lagrange, Newton, Splines cúbicos | Reconstrucción de precios diarios a partir de datos semanales dispersos |
| D | Costo acumulado y pérdida del poder adquisitivo | Trapecio, Simpson 1/3, Simpson 3/8 | Integral de c(t) para calcular el gasto mensual familiar real |
| E | Umbrales críticos de abastecimiento | Bisección, Newton-Raphson, Secante | Día exacto en que el consumo supera al reabastecimiento o el gasto al ingreso |

---

## Cómo funciona el router

`index.html` es el único archivo que el navegador carga. El archivo `js/app.js`
intercepta los clics de navegación y usa `fetch()` para cargar el contenido de
`pages/escenario-a.html` (u otro) e inyectarlo en el `<main>` sin recargar la página.
Cada módulo JS se importa dinámicamente tras inyectar el HTML correspondiente.

---

## Presets por módulo

Cada escenario incluye presets basados en situaciones reales de Bolivia 2026:

- **A:** Caso base · Bloqueo ruta Oruro–La Paz · Emergencia +50% demanda
- **B:** Operación normal · Bloqueo de rutas · Pánico de compra
- **C:** Papa · Arroz · Azúcar · Aceite
- **D:** Mes normal (lineal) · Mes de bloqueo (exponencial) · Crisis aguda (logística)
- **E:** Vaciado de reserva · Déficit familiar · Carburante crítico · Índice de opinión · Equilibrio de mercado

---

## Tecnologías

- HTML5 semántico
- CSS3 (custom properties, grid, flexbox) — sin frameworks CSS
- JavaScript ES6+ (módulos nativos, dynamic import)
- Chart.js 4.4.3 (gráficos)
- GitHub Pages (publicación estática sin configuración extra)

---

## Publicación

```
Página web:  https://colapso-en-ecuaciones-m-numericos.netlify.app/
Repositorio: https://github.com/JordyRHLM/DESAFIO-FINAL-METODOS-NUMERICOS.git
```

---

## Autor

**Jordy Herlan Miranda Choquetarqui**  
Carrera de Informática – UMSA, La Paz, Bolivia · Junio 2026
