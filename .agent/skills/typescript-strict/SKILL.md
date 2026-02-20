---
name: typescript-strict
description: TypeScript en modo estricto para Next.js + React. Úsame cuando trabajes con archivos .ts o .tsx para enforizar tipos estrictos, evitar any, y seguir best practices.
version: 1.0.0
tags: [typescript, types, strict]
---

# TypeScript Strict Mode Standards

## tsconfig.json Recomendado

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },

    // Strictness adicional
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Reglas de Typing

### ❌ NUNCA usar `any`

```typescript
// ❌ PROHIBIDO
function processData(data: any) {
  return data.value
}

// ✅ CORRECTO - usar unknown + type guard
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value
  }
  throw new Error('Invalid data')
}

// ✅ MEJOR - tipo genérico
function processData<T extends { value: string }>(data: T) {
  return data.value
}
```

### ✅ Return types explícitos en exports

```typescript
// ❌ EVITAR - inferido pero no explícito
export function getUser(id: string) {
  return db.users.findUnique({ where: { id } })
}

// ✅ CORRECTO
export async function getUser(id: string): Promise<User | null> {
  return db.users.findUnique({ where: { id } })
}
```

### ✅ Interfaces para props de componentes

```typescript
// ❌ EVITAR - type alias inline
const Button = ({ label, onClick }: { label: string, onClick: () => void }) => {
  return <button onClick={onClick}>{label}</button>
}

// ✅ CORRECTO
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export const Button = ({ label, onClick, variant = 'primary', disabled }: ButtonProps) => {
  return <button onClick={onClick} disabled={disabled}>{label}</button>
}
```

## Supabase Types

### Generar tipos desde schema

```bash
npx supabase gen types typescript --project-id "YOUR_PROJECT_ID" > src/types/database.types.ts
```

### Type helpers

```typescript
// src/types/index.ts
import type { Database } from './database.types'

// Row types (data que recibes)
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

// Insert types (data que envías en create)
export type Insertable<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

// Update types (data que envías en update)
export type Updatable<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// Uso
export type User = Tables<'users'>
export type NewUser = Insertable<'users'>
export type UserUpdate = Updatable<'users'>
```

### Typed Supabase client

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

// Ahora tienes autocomplete completo
const supabase = createClient()
const { data } = await supabase
  .from('users')  // ← autocomplete de tablas
  .select('*')    // ← autocomplete de columnas
```

## React Component Types

### Client Component

```typescript
'use client'
import { useState, type ReactNode } from 'react'

interface CardProps {
  title: string
  children: ReactNode
  className?: string
  onClose?: () => void
}

export function Card({ title, children, className, onClose }: CardProps) {
  const [isOpen, setIsOpen] = useState(true)
  
  return (
    <div className={className}>
      <h2>{title}</h2>
      {children}
      {onClose && <button onClick={onClose}>Close</button>}
    </div>
  )
}
```

### Server Component con async

```typescript
import type { ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function PageLayout({ 
  children, 
  params 
}: PageLayoutProps) {
  const { locale } = await params
  
  return (
    <div lang={locale}>
      {children}
    </div>
  )
}
```

### Form Component con Zod

```typescript
'use client'
import { useActionState } from 'react'
import { z } from 'zod'

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type FormData = z.infer<typeof formSchema>

interface LoginFormProps {
  onSubmit: (data: FormData) => Promise<{ error?: string }>
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(onSubmit, null)
  
  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isPending}>Login</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  )
}
```

## Server Actions Types

```typescript
'use server'

import { z } from 'zod'
import type { Tables, Insertable } from '@/types'

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.enum(['electronics', 'clothing', 'food']),
})

type ProductInput = z.infer<typeof productSchema>

interface ActionResult {
  success: boolean
  data?: Tables<'products'>
  error?: string
}

export async function createProduct(
  formData: FormData
): Promise<ActionResult> {
  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    price: Number(formData.get('price')),
    category: formData.get('category'),
  })
  
  if (!parsed.success) {
    return { 
      success: false, 
      error: 'Invalid data' 
    }
  }
  
  const product = await db.products.create({
    data: parsed.data
  })
  
  return { success: true, data: product }
}
```

## Utility Types

```typescript
// Hacer todos los campos opcionales excepto algunos
type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

type UserUpdate = PartialExcept<User, 'id'>

// Hacer todos los campos requeridos excepto algunos
type RequiredExcept<T, K extends keyof T> = Required<T> & Partial<Pick<T, K>>

// Deep Partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Excluir campos
type WithoutTimestamps<T> = Omit<T, 'created_at' | 'updated_at'>
```

## Discriminated Unions

```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

function processResult<T>(result: Result<T>) {
  if (result.success) {
    // TypeScript sabe que result.data existe
    console.log(result.data)
  } else {
    // TypeScript sabe que result.error existe
    console.error(result.error)
  }
}
```

## Type Guards

```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  )
}

function processUnknownData(data: unknown) {
  if (isUser(data)) {
    // TypeScript sabe que data es User
    console.log(data.email)
  }
}
```

## Enums vs Const Objects

```typescript
// ❌ EVITAR - enums generan código runtime innecesario
enum Status {
  Active = 'active',
  Inactive = 'inactive',
}

// ✅ MEJOR - const object con 'as const'
const Status = {
  Active: 'active',
  Inactive: 'inactive',
} as const

type Status = typeof Status[keyof typeof Status]
```

## Async Function Types

```typescript
// Función que retorna Promise
async function fetchUser(id: string): Promise<User | null> {
  return db.users.findUnique({ where: { id } })
}

// Función async que puede lanzar error
async function fetchUserOrThrow(id: string): Promise<User> {
  const user = await db.users.findUnique({ where: { id } })
  if (!user) throw new Error('User not found')
  return user
}

// Tipo para función async
type AsyncFn<T> = () => Promise<T>

const getUsers: AsyncFn<User[]> = async () => {
  return db.users.findMany()
}
```

## Generic Constraints

```typescript
// Constraint simple
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

// Constraint con extends
function merge<T extends object, U extends object>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 }
}

// Constraint con tipo específico
function createEntity<T extends { id: string }>(data: Omit<T, 'id'>): T {
  const id = crypto.randomUUID()
  return { ...data, id } as T
}
```

## noUncheckedIndexedAccess

```typescript
// Con noUncheckedIndexedAccess: true en tsconfig
const users: User[] = []

// ❌ Error: Object is possibly 'undefined'
const firstUser = users[0]
console.log(firstUser.name)

// ✅ CORRECTO - check explícito
const firstUser = users[0]
if (firstUser) {
  console.log(firstUser.name)
}

// ✅ CORRECTO - optional chaining
console.log(users[0]?.name)
```

## Type vs Interface

```typescript
// Usar interface para:
// - Shapes de objetos
// - Cuando necesitas declaration merging
// - Props de componentes React
interface User {
  id: string
  name: string
}

// Usar type para:
// - Unions
// - Intersections
// - Mapped types
// - Utility types
type Status = 'active' | 'inactive'
type UserWithStatus = User & { status: Status }
```

## Best Practices

1. **Nunca usar `any`** - usa `unknown` y type guards
2. **Return types explícitos** en todas las funciones exportadas
3. **Interfaces para props** de componentes
4. **Zod para runtime validation** de formularios y APIs
5. **Type helpers** para DRY con Supabase types
6. **Const objects con `as const`** en vez de enums
7. **Discriminated unions** para estados complejos
8. **noUncheckedIndexedAccess** habilitado
9. **Type guards** para unknown data
10. **Generic constraints** cuando sea apropiado
