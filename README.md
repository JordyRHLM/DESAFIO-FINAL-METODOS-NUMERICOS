# Simulación Numérica de Crisis
### Abastecimiento, Precios y Conflicto Social en Bolivia

**Desafío Final – Métodos Numéricos | UMSA**

---

## Estructura del proyecto

```
simulacion-crisis-bolivia/
│
├── index.html                            # Shell principal (navbar + router)
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
├── js/
│   ├── app.js                            # Router SPA: carga páginas sin recargar
│   │
│   ├── components/                       # Componentes reutilizables de UI
│   │   ├── navbar.js                     # Barra de navegación dinámica
│   │   ├── footer.js                     # Pie de página
│   │   └── loader.js                     # Spinner de carga entre secciones
│   │
│   ├── modules/                          # Lógica numérica por escenario
│   │   ├── escenario-a-sistemas.js       # LU, Jacobi, Gauss-Seidel, SOR, Grad. Conjugado
│   │   ├── escenario-b-ode.js            # Euler, Heun, RK4
│   │   ├── escenario-c-interpolacion.js  # Lagrange, Newton, Splines cúbicos
│   │   ├── escenario-d-integracion.js    # Trapecio, Simpson 1/3, Simpson 3/8
│   │   └── escenario-e-raices.js         # Bisección, Newton-Raphson, Secante
│   │
│   └── utils/
│       ├── math-helpers.js               # Operaciones matriciales, utilidades numéricas
│       ├── chart-helpers.js              # Wrappers de Chart.js para cada tipo de gráfico
│       └── ui-helpers.js                 # Render de tablas, mensajes de error, tooltips
│
└── assets/
    └── icons/                            # Íconos SVG propios
```

---

## Escenarios implementados (individual → 5 obligatorios)

| # | Escenario | Métodos numéricos | Puntos |
|---|-----------|-------------------|--------|
| A | Optimización de abastecimiento y red de transporte | LU, Jacobi, Gauss-Seidel, SOR, Gradiente Conjugado | 6 pts |
| B | Vaciado crítico de reservas de carburantes | Euler, Heun, RK4 | 6 pts |
| C | Curva continua de precios de alimentos | Lagrange, Newton, Splines cúbicos | 6 pts |
| D | Costo acumulado y pérdida del poder adquisitivo | Trapecio, Simpson 1/3, Simpson 3/8 | 6 pts |
| E | Umbrales críticos de abastecimiento | Bisección, Newton-Raphson, Secante | 6 pts |

---

## Cómo funciona el router

`index.html` es el único archivo que el navegador carga. El archivo `js/app.js`
intercepta los clics de navegación y usa `fetch()` para cargar el contenido de
`pages/escenario-a.html` (u otro) e inyectarlo en el `<main>` sin recargar la página.
Esto permite GitHub Pages sin configuración extra.

---

## Tecnologías

- HTML5 semántico
- CSS3 (custom properties, grid, flexbox) — sin frameworks CSS
- JavaScript ES6+ (módulos nativos)
- Chart.js 4.x (gráficos)
- GitHub Pages (publicación gratuita)

---

## Publicación

```
Página web:  https://[usuario].github.io/simulacion-crisis-bolivia/
Repositorio: https://github.com/[usuario]/simulacion-crisis-bolivia
```

## Autor

**Jordy Herlan Miranda Choquetarqui**  
Carrera de Informática – UMSA, La Paz, Bolivia
