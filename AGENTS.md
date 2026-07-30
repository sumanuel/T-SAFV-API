# T-SAFV-API — Workflow de Agentes Especializados

Este proyecto cuenta con **6 agentes especializados** que trabajan en secuencia para implementar features backend completos desde la idea hasta la validación de calidad, seguridad y UX.

## Flujo de Trabajo Completo

### Flujo Principal (Desarrollo de Features Backend)

```
Idea/Requerimiento
       ↓
[1] analista-requerimientos  → Especificación técnica detallada
       ↓
[2] planificador             → Plan de implementación paso a paso
       ↓
[3] programador-senior       → Código implementado y funcional
       ↓
[4] qa-esceptico             → Tests automatizados + Reporte de calidad
       ↓
Feature Backend Completo ✅
```

### Flujo de Validación de Calidad (Opcional pero Recomendado)

```
Feature Implementado
       ↓
[5] code-reviewer            → Revisión de código + Mejoras
       ↓
[6] qa-ui-ux                 → Tests end-to-end + Validación frontend-backend
       ↓
Feature Validado y Seguro ✅
```

---

## Stack Técnico

- Node.js + Express
- PostgreSQL 14+
- JWT Authentication
- Jest + Supertest para testing
- Sequelize como ORM

**Arquitectura**:

```
src/
  ├── config/         # Configuraciones y env
  ├── models/         # Modelos Sequelize
  ├── controllers/    # Lógica de negocio
  ├── routes/         # Definición de endpoints
  ├── middleware/     # Auth, validators, error handling
  └── utils/          # Helpers
```

---

## Agentes Disponibles

### 1. Analista de Requerimientos Senior

**Nombre**: `analista-requerimientos`  
**Archivo**: `.agents/analista-requerimientos.agent.md`

**Propósito**: Convertir ideas vagas en especificaciones técnicas detalladas de endpoints backend.

**Cuándo usar**:

- Tienes una idea de feature backend pero no está clara
- Necesitas documentar nuevos endpoints formalmente
- Quieres asegurar que todos los casos están cubiertos

**Entrada esperada**:

- Descripción general del feature (puede ser breve)
- Contexto del problema a resolver
- Entidades afectadas (usuarios, asociaciones, vehículos, etc.)

**Salida**:

- Documento de especificación completo en `docs/specs/FEATURE-XXX-nombre.md`
- Endpoints RESTful detallados
- Modelo de datos
- Validaciones
- Reglas de autorización
- Casos de uso
- Criterios de aceptación

**Ejemplo de uso**:

```
@analista-requerimientos Necesito un endpoint para que los fiscales puedan
registrar inspecciones periódicas de vehículos con fotos y observaciones.
```

---

### 2. Planificador Técnico Senior

**Nombre**: `planificador`  
**Archivo**: `.agents/planificador.agent.md`

**Propósito**: Crear planes de implementación detallados, identificando migraciones, modelos, controllers, routes, middleware y tests.

**Cuándo usar**:

- Tienes una especificación y necesitas saber CÓMO implementarla
- Quieres estimar tiempo y complejidad
- Necesitas un roadmap técnico detallado

**Entrada esperada**:

- Especificación completa (generada por analista-requerimientos)
- O referencia al archivo de spec

**Salida**:

- Plan de implementación en `docs/plans/PLAN-XXX-nombre.md`
- Fases secuenciales de trabajo
- Archivos exactos a crear/modificar
- Código de ejemplo para migraciones, modelos, controllers, routes, tests
- Estimación de tiempo
- Riesgos identificados

**Ejemplo de uso**:

```
@planificador Crea un plan de implementación para el feature documentado
en docs/specs/FEATURE-001-inspecciones-periodicas.md
```

---

### 3. Programador Senior Backend

**Nombre**: `programador-senior`  
**Archivo**: `.agents/programador-senior.agent.md`

**Propósito**: Implementar features backend siguiendo el plan técnico y las mejores prácticas del proyecto.

**Cuándo usar**:

- Tienes un plan de implementación y necesitas código
- Quieres que se sigan los patrones existentes del proyecto
- Necesitas implementación completa (DB migrations, models, controllers, routes, tests)

**Entrada esperada**:

- Plan de implementación (generado por planificador)
- O especificación si el plan es simple

**Salida**:

- Código fuente completamente implementado
- Migraciones de base de datos
- Modelos Sequelize
- Controllers con lógica de negocio
- Routes RESTful
- Middleware de validación
- Tests unitarios y de integración
- Feature funcional y probado

**Ejemplo de uso**:

```
@programador-senior Implementa el feature según el plan en
docs/plans/PLAN-001-inspecciones-periodicas.md
```

---

### 4. QA Senior Escéptico

**Nombre**: `qa-esceptico`  
**Archivo**: `.agents/qa-esceptico.agent.md`

**Propósito**: Crear tests automatizados exhaustivos (unitarios + integración), encontrar edge cases y generar reportes de calidad.

**Cuándo usar**:

- Tienes código backend implementado que necesita validación
- Quieres tests automatizados (unit + integration con supertest)
- Necesitas un reporte de calidad formal
- Quieres asegurar que no hay regresiones

**Entrada esperada**:

- Feature implementado
- Especificación original (para validar criterios)
- Código fuente a testear

**Salida**:

- Tests unitarios en `__tests__/unit/`
- Tests de integración en `__tests__/integration/`
- Reporte de calidad en `docs/qa-reports/QA-REPORT-XXX.md`
- Bugs documentados con severidad
- Recomendaciones de mejora
- Cobertura de código

**Ejemplo de uso**:

```
@qa-esceptico Crea tests automatizados para el feature FEATURE-001
(inspecciones periódicas) y genera un reporte de calidad completo
```

---

### 5. Code Reviewer Senior

**Nombre**: `code-reviewer`  
**Archivo**: `.agents/code-reviewer.agent.md`

**Propósito**: Revisar código backend implementado para identificar problemas de calidad, rendimiento, seguridad y cumplimiento de patrones del proyecto.

**Cuándo usar**:

- Feature implementado necesita revisión antes de merge
- Quieres validar que se siguen los patrones del proyecto
- Necesitas identificar code smells y problemas de arquitectura
- Buscas oportunidades de refactorización

**Entrada esperada**:

- Feature implementado (archivos modificados/creados)
- Referencia a especificación o plan (opcional)

**Salida**:

- Reporte de revisión en `docs/code-reviews/CODE-REVIEW-XXX.md`
- Issues críticos, menores y sugerencias
- Código propuesto para correcciones
- Decisión: APROBAR / CAMBIOS MENORES / RECHAZAR

**Ejemplo de uso**:

```
@code-reviewer Revisa la implementación del feature FEATURE-001
```

---

### 6. QA UI/UX Senior (End-to-End)

**Nombre**: `qa-ui-ux`  
**Archivo**: `.agents/qa-ui-ux.agent.md`

**Propósito**: Crear planes de pruebas end-to-end validando integración frontend-backend, flujos de usuario, accesibilidad y experiencia completa.

**Cuándo usar**:

- Feature backend necesita validación con frontend móvil
- Necesitas tests end-to-end de flujos de usuario
- Quieres validar que el contrato API/Frontend está sincronizado

**Entrada esperada**:

- Feature implementado backend + frontend
- Especificación de flujos de usuario

**Salida**:

- Plan de pruebas en `docs/qa-ui-plans/QA-UI-PLAN-XXX.md`
- Validación de sincronización frontend-backend
- Reporte de experiencia de usuario completa

**Ejemplo de uso**:

```
@qa-ui-ux Crea plan de pruebas end-to-end para FEATURE-001 (inspecciones periódicas)
```

---

## Flujo Completo Ejemplo

### Paso 1: Idea Inicial

```
Usuario: "Necesito que los fiscales puedan registrar inspecciones periódicas de vehículos"
```

### Paso 2: Análisis de Requerimientos

```
@analista-requerimientos Necesito endpoints para que fiscales registren
inspecciones periódicas de vehículos con fotos, observaciones y estado (aprobado/rechazado).

→ Genera: docs/specs/FEATURE-001-inspecciones-periodicas.md
```

### Paso 3: Planificación

```
@planificador Crea un plan de implementación para
docs/specs/FEATURE-001-inspecciones-periodicas.md

→ Genera: docs/plans/PLAN-001-inspecciones-periodicas.md
```

### Paso 4: Implementación

```
@programador-senior Implementa el feature según
docs/plans/PLAN-001-inspecciones-periodicas.md

→ Crea:
  - database/migrations/XXXX-create-inspecciones.js
  - src/models/Inspeccion.js
  - src/controllers/inspeccionController.js
  - src/routes/inspeccionRoutes.js
  - src/middleware/validateInspeccion.js
```

### Paso 5: Testing y QA

```
@qa-esceptico Valida el feature FEATURE-001 con tests automatizados
y genera reporte de calidad

→ Crea:
  - __tests__/unit/controllers/inspeccionController.test.js
  - __tests__/integration/routes/inspeccionRoutes.test.js
  - docs/qa-reports/QA-REPORT-FEATURE-001.md
```

### Paso 6: Code Review (Recomendado para features importantes)

```
@code-reviewer Revisa la implementación de FEATURE-001

→ Genera:
  - docs/code-reviews/CODE-REVIEW-FEATURE-001.md
  - Lista de issues críticos, menores y sugerencias
  - Decisión: APROBAR / CAMBIOS MENORES / RECHAZAR
```

### Paso 7: Validación End-to-End (Si hay frontend coordinado)

```
@qa-ui-ux Crea plan de pruebas end-to-end para FEATURE-001

→ Genera:
  - docs/qa-ui-plans/QA-UI-PLAN-FEATURE-001.md
  - Validación de integración frontend-backend
```

---

## Mejores Prácticas

### 1. Usa el flujo completo (6 agentes) para features críticos

Para features importantes que manejan datos sensibles, autenticación, o son visibles al usuario, pasa por los 6 agentes.

### 2. Usa flujo de desarrollo (4 agentes) para features estándar

Para features normales sin datos sensibles: analista → planificador → programador → qa-esceptico.

### 3. Agrega validación selectiva según necesidad

- **Code Review**: Para refactorizaciones grandes o código complejo
- **QA UI/UX**: Para features que afectan directamente la experiencia de usuario móvil

### 4. Puedes saltar agentes para cambios triviales

Para cambios muy pequeños (ej: agregar un campo sin lógica), puedes ir directo a programador-senior + qa-esceptico.

### 5. Code review antes de merge a main

Usa code-reviewer para todas las PR importantes antes de merge a rama principal.

### 6. Validación end-to-end periódica

Ejecuta qa-ui-ux para features que tocan frontend móvil, validando sincronización de contratos.

---

## Comandos Rápidos

### Feature Completo (Flujo Desarrollo + Validación)

```bash
# FASE 1: DESARROLLO
# 1. Análisis
@analista-requerimientos [descripción del feature]

# 2. Planificación
@planificador Planifica docs/specs/FEATURE-XXX-nombre.md

# 3. Implementación
@programador-senior Implementa docs/plans/PLAN-XXX-nombre.md

# 4. Testing Lógica
@qa-esceptico Valida FEATURE-XXX con tests y reporte

# FASE 2: VALIDACIÓN (Recomendado para features importantes)
# 5. Code Review
@code-reviewer Revisa implementación de FEATURE-XXX

# 6. Testing End-to-End (si afecta frontend)
@qa-ui-ux Crea plan de pruebas end-to-end para FEATURE-XXX
```

### Feature Rápido (Solo Desarrollo)

```bash
# Para features pequeños sin datos sensibles
@analista-requerimientos [idea]
@planificador [spec file]
@programador-senior [plan file]
@qa-esceptico [feature]
```

### Cambio Simple (Solo Programación + QA)

```bash
# Si ya sabes exactamente qué hacer
@programador-senior [descripción técnica del cambio]
@qa-esceptico Crea tests para [módulo modificado]
```

### Validación de Código Existente

```bash
# Solo code review
@code-reviewer Revisa el módulo [nombre]

# Solo end-to-end
@qa-ui-ux Valida flujo end-to-end de [feature]
```

---

## Estructura de Documentos Generados

```
T-SAFV-API/
  docs/
    specs/                         # Especificaciones
      FEATURE-001-nombre.md
      FEATURE-002-nombre.md

    plans/                         # Planes de implementación
      PLAN-001-nombre.md
      PLAN-002-nombre.md

    qa-reports/                    # Reportes de QA (lógica backend)
      QA-REPORT-FEATURE-001.md
      QA-REPORT-FEATURE-002.md

    code-reviews/                  # Reportes de code review
      CODE-REVIEW-FEATURE-001.md
      CODE-REVIEW-FEATURE-002.md

    qa-ui-plans/                   # Planes de pruebas end-to-end
      QA-UI-PLAN-FEATURE-001.md
      QA-UI-PLAN-FEATURE-002.md

  __tests__/                       # Tests automatizados
    unit/                          # Tests unitarios
      controllers/
      models/
      utils/

    integration/                   # Tests de integración
      routes/

  src/                             # Código implementado
    models/
    controllers/
    routes/
    middleware/
```

---

## 📊 Matriz de Decisión: ¿Qué Agentes Usar?

| Tipo de Cambio                                | Agentes Recomendados         | Tiempo Estimado |
| --------------------------------------------- | ---------------------------- | --------------- |
| **Feature Crítico** (autenticación, permisos) | Los 6 agentes                | 3-5 días        |
| **Feature Importante** (nuevo módulo backend) | Desarrollo (4) + Code Review | 2-3 días        |
| **Feature Estándar** (CRUD normal)            | Desarrollo (4 agentes)       | 1-2 días        |
| **Cambio Simple** (agregar campo)             | Programador + QA Escéptico   | 2-4 horas       |
| **Refactorización**                           | Code Reviewer                | 1 día           |

---

## 🎯 Resumen de Outputs por Agente

| Agente                  | Output Principal       | Ubicación                              |
| ----------------------- | ---------------------- | -------------------------------------- |
| analista-requerimientos | Especificación técnica | `docs/specs/FEATURE-XXX.md`            |
| planificador            | Plan de implementación | `docs/plans/PLAN-XXX.md`               |
| programador-senior      | Código fuente backend  | `src/**/*` + `database/migrations/*`   |
| qa-esceptico            | Tests + Reporte QA     | `__tests__/**/*` + `docs/qa-reports/`  |
| code-reviewer           | Reporte de revisión    | `docs/code-reviews/CODE-REVIEW-XXX.md` |
| qa-ui-ux                | Plan end-to-end        | `docs/qa-ui-plans/QA-UI-PLAN-XXX.md`   |

---

**Última actualización**: 2025-01-27  
**Versión**: 1.0.0  
**Mantenedor**: Equipo de desarrollo T-SAFV
