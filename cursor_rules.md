1. Screaming Architecture

La arquitectura debe reflejar el negocio, no el framework.

❌ Incorrecto

components/
hooks/
utils/

✅ Correcto

modules/
  courses
  payments
  users
  analytics

Cada módulo representa una funcionalidad del negocio.

2. Feature Driven Architecture

Toda funcionalidad debe vivir dentro de:

src/modules

Ejemplo:

src/modules/courses

Estructura obligatoria:

courses
 ├── components
 ├── hooks
 ├── services
 ├── api
 ├── utils
 ├── types
 ├── constants
 ├── styles.ts
 └── CoursesPage.tsx

Reglas:

Cada módulo es autónomo

No mezclar lógica entre módulos

Compartir solo mediante /shared

3. Shared Layer

Para reutilización global.

src/shared
 ├── components
 ├── hooks
 ├── utils
 ├── services
 └── types

Ejemplo:

shared/hooks/useDebounce.ts
shared/utils/formatPrice.ts
4. Pages Rule (Muy importante)

Las páginas solo importan el módulo.

Ejemplo:

app/courses/page.tsx
import { CoursesPage } from "@/modules/courses";

export default function Page() {
  return <CoursesPage />;
}

No debe haber:

lógica

fetch

hooks

estados

5. Clean Architecture (Light)

Dentro del módulo separar responsabilidades:

courses
 ├── components
 ├── hooks
 ├── services
 └── api
Components

Solo UI.

CourseCard.tsx
CourseList.tsx

No deben:

hacer fetch

tener lógica compleja

Hooks

Contienen lógica de negocio del frontend.

Ejemplo:

useCourses.ts
useCoursePurchase.ts
Services

Capa de acceso a datos.

Ejemplo:

courses.service.ts
export async function getCourses() {
  return fetch("/api/courses").then(res => res.json());
}
API

Endpoints backend.

src/app/api/courses/route.ts
6. Data Fetching

Siempre usar:

TanStack Query

Nunca usar:

useEffect + fetch

Ejemplo correcto:

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: getCourses,
  });
}
7. Performance Rules

Siempre optimizar usando:

React.memo

useMemo

useCallback

dynamic imports

lazy loading

Evitar:

re-renders

cálculos en render

funciones inline pesadas

8. Styling Rules

Los estilos deben ir en:

styles.ts

Ejemplo:

const className = {
  container: "flex flex-col gap-6",
  title: "text-2xl font-bold",
  card: "p-4 border rounded-xl",
};

export default className;

Uso:

import className from "./styles";

Reglas:

usar Tailwind

no usar CSS

no usar inline styles

9. Security Rules

Si se crean APIs:

validar input

sanitizar datos

manejar errores

no exponer secrets

usar try/catch

10. Code Quality Rules

Aplicar siempre:

Clean Code

funciones pequeñas

nombres claros

evitar duplicación

evitar lógica compleja en componentes

SOLID Principles

Aplicar:

Single Responsibility

Open/Closed

Liskov

Interface Segregation

Dependency Inversion

11. Design Patterns

Preferir patrones:

Frontend:

Custom Hooks Pattern

Container / Presentational

Module Pattern

Arquitectura:

Service Layer

Adapter Pattern

Factory Pattern

12. Reusability Rules

Antes de crear algo nuevo revisar:

shared/components
shared/hooks
shared/utils

Evitar duplicar lógica.

13. SEO Rules

Cuando sea necesario:

usar metadata

headings correctos

next/image

alt en imágenes

lazy loading

14. Naming Conventions

Componentes:

PascalCase

Hooks:

useSomething

Services:

something.service.ts

Utils:

something.util.ts
15. Folder Example (Real)

Arquitectura final recomendada:

src
 ├── app
 │
 ├── modules
 │   ├── courses
 │   │   ├── components
 │   │   ├── hooks
 │   │   ├── services
 │   │   ├── utils
 │   │   ├── types
 │   │   ├── constants
 │   │   ├── styles.ts
 │   │   └── CoursesPage.tsx
 │
 │   ├── payments
 │   └── users
 │
 ├── shared
 │   ├── components
 │   ├── hooks
 │   ├── utils
 │   └── services
 │
 └── lib
16. Absolute Imports

Siempre usar:

@/modules
@/shared
@/lib

Nunca:

../../../
17. API Optimization

cachear respuestas

evitar queries pesadas

seleccionar solo campos necesarios

usar paginación

18. General Rule for Cursor

Siempre generar código que sea:

escalable

reutilizable

optimizado

limpio

fácil de mantener