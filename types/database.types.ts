export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      arqueos_caja: {
        Row: {
          created_at: string | null
          diferencia: number | null
          estado: string
          fecha_apertura: string | null
          fecha_cierre: string | null
          id: string
          monto_final_real: number | null
          monto_inicial: number
          monto_ventas_efectivo: number
          monto_ventas_otros: number
          observaciones: string | null
          tenant_id: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          diferencia?: number | null
          estado?: string
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          monto_final_real?: number | null
          monto_inicial?: number
          monto_ventas_efectivo?: number
          monto_ventas_otros?: number
          observaciones?: string | null
          tenant_id: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          diferencia?: number | null
          estado?: string
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          monto_final_real?: number | null
          monto_inicial?: number
          monto_ventas_efectivo?: number
          monto_ventas_otros?: number
          observaciones?: string | null
          tenant_id?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arqueos_caja_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqueos_caja_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencias: {
        Row: {
          creado_en: string
          entrada: string
          estado: string | null
          horas_extra: number | null
          id: string
          salida: string | null
          tenant_id: string
          usuario_id: string
        }
        Insert: {
          creado_en?: string
          entrada?: string
          estado?: string | null
          horas_extra?: number | null
          id?: string
          salida?: string | null
          tenant_id: string
          usuario_id: string
        }
        Update: {
          creado_en?: string
          entrada?: string
          estado?: string | null
          horas_extra?: number | null
          id?: string
          salida?: string | null
          tenant_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          created_at: string
          id: string
          nombre: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_gastos: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_gastos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion: {
        Row: {
          created_at: string | null
          direccion: string | null
          email: string | null
          encabezado_boleta: string | null
          id: string
          nombre_negocio: string | null
          pie_boleta: string | null
          razon_social: string | null
          rut: string | null
          simbolo_moneda: string | null
          telefono: string | null
          tenant_id: string | null
          umbral_stock_bajo: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          encabezado_boleta?: string | null
          id?: string
          nombre_negocio?: string | null
          pie_boleta?: string | null
          razon_social?: string | null
          rut?: string | null
          simbolo_moneda?: string | null
          telefono?: string | null
          tenant_id?: string | null
          umbral_stock_bajo?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          encabezado_boleta?: string | null
          id?: string
          nombre_negocio?: string | null
          pie_boleta?: string | null
          razon_social?: string | null
          rut?: string | null
          simbolo_moneda?: string | null
          telefono?: string | null
          tenant_id?: string | null
          umbral_stock_bajo?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          categoria_id: string | null
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["venta_estado"] | null
          fecha_gasto: string
          id: string
          ingreso_inventario_id: string | null
          monto_iva: number
          monto_neto: number
          monto_total: number
          tenant_id: string
          tipo_documento: string
          tipo_gasto: string
          usuario_id: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          descripcion: string
          estado?: Database["public"]["Enums"]["venta_estado"] | null
          fecha_gasto?: string
          id?: string
          ingreso_inventario_id?: string | null
          monto_iva?: number
          monto_neto?: number
          monto_total?: number
          tenant_id: string
          tipo_documento?: string
          tipo_gasto?: string
          usuario_id: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["venta_estado"] | null
          fecha_gasto?: string
          id?: string
          ingreso_inventario_id?: string | null
          monto_iva?: number
          monto_neto?: number
          monto_total?: number
          tenant_id?: string
          tipo_documento?: string
          tipo_gasto?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gastos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_gastos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_ingreso_inventario_id_fkey"
            columns: ["ingreso_inventario_id"]
            isOneToOne: false
            referencedRelation: "ingresos_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_roles: {
        Row: {
          created_at: string
          hora_entrada: string
          hora_salida: string
          id: string
          rol: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hora_entrada: string
          hora_salida: string
          id?: string
          rol: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hora_entrada?: string
          hora_salida?: string
          id?: string
          rol?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_usuarios: {
        Row: {
          created_at: string
          dia_semana: number
          hora_entrada: string
          hora_salida: string
          id: string
          tenant_id: string
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          dia_semana: number
          hora_entrada: string
          hora_salida: string
          id?: string
          tenant_id: string
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          dia_semana?: number
          hora_entrada?: string
          hora_salida?: string
          id?: string
          tenant_id?: string
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_usuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingreso_inventario_detalles: {
        Row: {
          cantidad: number
          costo_unitario: number
          id: string
          ingreso_id: string
          producto_id: string
        }
        Insert: {
          cantidad: number
          costo_unitario: number
          id?: string
          ingreso_id: string
          producto_id: string
        }
        Update: {
          cantidad?: number
          costo_unitario?: number
          id?: string
          ingreso_id?: string
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingreso_inventario_detalles_ingreso_id_fkey"
            columns: ["ingreso_id"]
            isOneToOne: false
            referencedRelation: "ingresos_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingreso_inventario_detalles_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      ingresos_inventario: {
        Row: {
          codigo: string
          created_at: string
          estado: Database["public"]["Enums"]["venta_estado"] | null
          generar_gasto: boolean | null
          id: string
          monto_iva: number | null
          observaciones: string | null
          proveedor_id: string | null
          subtotal: number | null
          tenant_id: string
          tipo_documento: string | null
          total: number | null
          usuario_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          estado?: Database["public"]["Enums"]["venta_estado"] | null
          generar_gasto?: boolean | null
          id?: string
          monto_iva?: number | null
          observaciones?: string | null
          proveedor_id?: string | null
          subtotal?: number | null
          tenant_id: string
          tipo_documento?: string | null
          total?: number | null
          usuario_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["venta_estado"] | null
          generar_gasto?: boolean | null
          id?: string
          monto_iva?: number | null
          observaciones?: string | null
          proveedor_id?: string | null
          subtotal?: number | null
          tenant_id?: string
          tipo_documento?: string | null
          total?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingresos_inventario_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingresos_inventario_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingresos_inventario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_produccion: {
        Row: {
          cantidad_a_producir: number
          cantidad_producida: number | null
          costo_ingredientes: number | null
          created_at: string
          estado: Database["public"]["Enums"]["orden_estado"]
          fecha_completada: string | null
          fecha_creacion: string
          fecha_programada: string | null
          id: string
          notas: string | null
          numero_orden: string
          producto_id: string
          receta_id: string
          tenant_id: string
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          cantidad_a_producir: number
          cantidad_producida?: number | null
          costo_ingredientes?: number | null
          created_at?: string
          estado: Database["public"]["Enums"]["orden_estado"]
          fecha_completada?: string | null
          fecha_creacion?: string
          fecha_programada?: string | null
          id?: string
          notas?: string | null
          numero_orden: string
          producto_id: string
          receta_id: string
          tenant_id: string
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          cantidad_a_producir?: number
          cantidad_producida?: number | null
          costo_ingredientes?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["orden_estado"]
          fecha_completada?: string | null
          fecha_creacion?: string
          fecha_programada?: string | null
          id?: string
          notas?: string | null
          numero_orden?: string
          producto_id?: string
          receta_id?: string
          tenant_id?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_produccion_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_produccion_receta_id_fkey"
            columns: ["receta_id"]
            isOneToOne: false
            referencedRelation: "recetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_produccion_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_produccion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean | null
          categoria: string | null
          categoria_id: string | null
          codigo: string | null
          costo_receta: number | null
          costo_unitario: number | null
          created_at: string
          descripcion: string | null
          es_pesable: boolean | null
          factor_conversion: number | null
          id: string
          imagen_url: string | null
          margen_deseado: number | null
          mostrar_en_pos: boolean | null
          nombre: string
          precio_sugerido: number | null
          precio_venta: number | null
          stock_actual: number | null
          stock_minimo: number | null
          tenant_id: string
          tiene_receta: boolean | null
          tipo: Database["public"]["Enums"]["producto_tipo"]
          unidad_medida: Database["public"]["Enums"]["unidad_medida"]
          unidad_medida_base:
            | Database["public"]["Enums"]["unidad_medida"]
            | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          categoria_id?: string | null
          codigo?: string | null
          costo_receta?: number | null
          costo_unitario?: number | null
          created_at?: string
          descripcion?: string | null
          es_pesable?: boolean | null
          factor_conversion?: number | null
          id?: string
          imagen_url?: string | null
          margen_deseado?: number | null
          mostrar_en_pos?: boolean | null
          nombre: string
          precio_sugerido?: number | null
          precio_venta?: number | null
          stock_actual?: number | null
          stock_minimo?: number | null
          tenant_id: string
          tiene_receta?: boolean | null
          tipo: Database["public"]["Enums"]["producto_tipo"]
          unidad_medida: Database["public"]["Enums"]["unidad_medida"]
          unidad_medida_base?:
            | Database["public"]["Enums"]["unidad_medida"]
            | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          categoria_id?: string | null
          codigo?: string | null
          costo_receta?: number | null
          costo_unitario?: number | null
          created_at?: string
          descripcion?: string | null
          es_pesable?: boolean | null
          factor_conversion?: number | null
          id?: string
          imagen_url?: string | null
          margen_deseado?: number | null
          mostrar_en_pos?: boolean | null
          nombre?: string
          precio_sugerido?: number | null
          precio_venta?: number | null
          stock_actual?: number | null
          stock_minimo?: number | null
          tenant_id?: string
          tiene_receta?: boolean | null
          tipo?: Database["public"]["Enums"]["producto_tipo"]
          unidad_medida?: Database["public"]["Enums"]["unidad_medida"]
          unidad_medida_base?:
            | Database["public"]["Enums"]["unidad_medida"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          rut: string | null
          telefono: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          rut?: string | null
          telefono?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          rut?: string | null
          telefono?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      receta_ingredientes: {
        Row: {
          cantidad: number
          costo_linea: number | null
          created_at: string
          id: string
          ingrediente_id: string
          notas: string | null
          orden: number | null
          receta_id: string
          tenant_id: string
        }
        Insert: {
          cantidad: number
          costo_linea?: number | null
          created_at?: string
          id?: string
          ingrediente_id: string
          notas?: string | null
          orden?: number | null
          receta_id: string
          tenant_id: string
        }
        Update: {
          cantidad?: number
          costo_linea?: number | null
          created_at?: string
          id?: string
          ingrediente_id?: string
          notas?: string | null
          orden?: number | null
          receta_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receta_ingredientes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receta_ingredientes_receta_id_fkey"
            columns: ["receta_id"]
            isOneToOne: false
            referencedRelation: "recetas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receta_ingredientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recetas: {
        Row: {
          activa: boolean | null
          costo_por_unidad: number | null
          costo_total: number | null
          created_at: string
          descripcion: string | null
          id: string
          instrucciones: string | null
          nombre: string
          producto_id: string
          rendimiento: number
          tenant_id: string
          tiempo_preparacion_minutos: number | null
          updated_at: string
          version: number | null
        }
        Insert: {
          activa?: boolean | null
          costo_por_unidad?: number | null
          costo_total?: number | null
          created_at?: string
          descripcion?: string | null
          id?: string
          instrucciones?: string | null
          nombre: string
          producto_id: string
          rendimiento: number
          tenant_id: string
          tiempo_preparacion_minutos?: number | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          activa?: boolean | null
          costo_por_unidad?: number | null
          costo_total?: number | null
          created_at?: string
          descripcion?: string | null
          id?: string
          instrucciones?: string | null
          nombre?: string
          producto_id?: string
          rendimiento?: number
          tenant_id?: string
          tiempo_preparacion_minutos?: number | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recetas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          rut: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          rut?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          rut?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: boolean | null
          created_at: string
          email: string
          id: string
          nombre_completo: string | null
          rol: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          email: string
          id: string
          nombre_completo?: string | null
          rol?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          email?: string
          id?: string
          nombre_completo?: string | null
          rol?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      venta_detalles: {
        Row: {
          cantidad: number
          costo_unitario: number | null
          created_at: string
          descuento: number | null
          id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          tenant_id: string
          total: number
          venta_id: string
        }
        Insert: {
          cantidad: number
          costo_unitario?: number | null
          created_at?: string
          descuento?: number | null
          id?: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          tenant_id: string
          total: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          costo_unitario?: number | null
          created_at?: string
          descuento?: number | null
          id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
          tenant_id?: string
          total?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_detalles_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_detalles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_detalles_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          arqueo_id: string | null
          cliente_nombre: string | null
          cliente_rut: string | null
          created_at: string
          descuento: number | null
          estado: Database["public"]["Enums"]["venta_estado"] | null
          fecha: string
          id: string
          metodo_pago: Database["public"]["Enums"]["metodo_pago"] | null
          notas: string | null
          numero_venta: string
          subtotal: number | null
          tenant_id: string
          total: number
          usuario_id: string | null
        }
        Insert: {
          arqueo_id?: string | null
          cliente_nombre?: string | null
          cliente_rut?: string | null
          created_at?: string
          descuento?: number | null
          estado?: Database["public"]["Enums"]["venta_estado"] | null
          fecha?: string
          id?: string
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"] | null
          notas?: string | null
          numero_venta: string
          subtotal?: number | null
          tenant_id: string
          total: number
          usuario_id?: string | null
        }
        Update: {
          arqueo_id?: string | null
          cliente_nombre?: string | null
          cliente_rut?: string | null
          created_at?: string
          descuento?: number | null
          estado?: Database["public"]["Enums"]["venta_estado"] | null
          fecha?: string
          id?: string
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"] | null
          notas?: string | null
          numero_venta?: string
          subtotal?: number | null
          tenant_id?: string
          total?: number
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_arqueo_id_fkey"
            columns: ["arqueo_id"]
            isOneToOne: false
            referencedRelation: "arqueos_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_production_v1: {
        Args: { p_order_id: string; p_tenant_id: string }
        Returns: undefined
      }
      create_sale_v1: {
        Args: {
          p_arqueo_id: string
          p_cliente_nombre: string
          p_cliente_rut: string
          p_descuento_global: number
          p_items: Json
          p_metodo_pago: Database["public"]["Enums"]["metodo_pago"]
          p_notas: string
          p_tenant_id: string
          p_usuario_id: string
        }
        Returns: string
      }
      decrement_stock: {
        Args: { amount: number; product_id: string }
        Returns: undefined
      }
      get_my_tenant_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      get_user_tenant_id: { Args: never; Returns: string }
      increment_stock: {
        Args: { amount: number; product_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      procesar_ingreso_inventario:
        | {
            Args: {
              p_detalles: Database["public"]["CompositeTypes"]["ingreso_detalle_type"][]
              p_observaciones?: string
              p_tenant_id: string
              p_usuario_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_detalles: Database["public"]["CompositeTypes"]["ingreso_detalle_type"][]
              p_generar_gasto?: boolean
              p_monto_iva?: number
              p_observaciones?: string
              p_subtotal?: number
              p_tenant_id: string
              p_tipo_documento?: string
              p_total?: number
              p_usuario_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_detalles: Database["public"]["CompositeTypes"]["ingreso_detalle_type"][]
              p_generar_gasto?: boolean
              p_monto_iva?: number
              p_observaciones?: string
              p_proveedor_id?: string
              p_subtotal?: number
              p_tenant_id: string
              p_tipo_documento?: string
              p_total?: number
              p_usuario_id: string
            }
            Returns: Json
          }
    }
    Enums: {
      metodo_pago:
        | "efectivo"
        | "tarjeta_debito"
        | "tarjeta_credito"
        | "transferencia"
      orden_estado: "pendiente" | "en_proceso" | "completada" | "cancelada"
      producto_tipo: "ingrediente" | "producto_terminado" | "ambos"
      unidad_medida: "kg" | "g" | "L" | "ml" | "unidades"
      venta_estado: "completada" | "anulada"
    }
    CompositeTypes: {
      ingreso_detalle_type: {
        producto_id: string | null
        cantidad: number | null
        costo_unitario: number | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      metodo_pago: [
        "efectivo",
        "tarjeta_debito",
        "tarjeta_credito",
        "transferencia",
      ],
      orden_estado: ["pendiente", "en_proceso", "completada", "cancelada"],
      producto_tipo: ["ingrediente", "producto_terminado", "ambos"],
      unidad_medida: ["kg", "g", "L", "ml", "unidades"],
      venta_estado: ["completada", "anulada"],
    },
  },
} as const
