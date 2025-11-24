# ADMIN TODO LIST

## 0. Correcciones críticas previas

- [x] Permitir acceso ADMIN a cualquier dashboard de evento.
- [x] Asegurar rol en JWT/Session.

## 1. Flujo de Publicación de Eventos

- [ ] Botón Solicitar publicación en dashboard evento.
- [ ] Crear /dashboard/requests/page.tsx.
- [ ] Motivo de rechazo con ModerationLog.

## 2. Revisión de Eventos (ADMIN)

- [x] Completar /admin/reviews/page.tsx.
- [x] Crear /admin/reviews/[eventId]/page.tsx.
- [x] Aprobar / Denegar eventos.

## 3. Gestión Global de Eventos

- [x] Mejorar /admin/events/page.tsx.
- [x] Crear /admin/events/[eventId]/page.tsx.
- [x] Modo Impersonate.

## 4. Gestión de Usuarios

- [ ] Mejorar /admin/users/page.tsx.
- [ ] Crear /admin/users/[userId]/page.tsx.

## 5. Sistema de Reportes

- [ ] Botón Reportar evento en vista pública.
- [ ] Completar /admin/reports/page.tsx.

## 6. Historial de Moderación

- [ ] Crear /admin/logs/page.tsx.

## 7. Notificaciones

- [ ] Crear /admin/notifications/page.tsx.
- [ ] Crear componente AdminNotifications.

## 8. Sistema de Soporte

- [ ] Crear /dashboard/support/* rutas.
- [ ] Crear /admin/chats/* rutas.

## 9. API interna

- [ ] Endpoints admin/events.
- [ ] Endpoints admin/users.
- [ ] Endpoints moderación y soporte.

## 10. Mejoras finales

- [ ] Completar dashboard principal admin.
- [ ] Mejorar middleware y seguridad.


------

# Instrucciones para las tareas pendientes (en orden)

*(Panel de Administración Definitivo + Flujo de Publicación + Moderación + Soporte)*

---

## **0. Correcciones críticas previas (antes de empezar el desarrollo)**

### **0.1. Arreglar permisos y “Modo Dios”**

* [ ] Permitir que `ADMIN` entre a **cualquier** dashboard de evento en:
  `src/app/dashboard/event/[id]/page.tsx`
  *(quitar el check de ownership y permitir acceso si `role === ADMIN`)*

* [x] Asegurar que el `role` de usuario viaja correctamente en JWT + Session (auth.ts + middleware)
  *(para que el admin pueda acceder a todo sin errores 404/307)*

---

# **1. Flujo de Publicación de Eventos (EventStatus)**

*(Debe hacerse antes de construir el panel admin, porque muchas rutas lo necesitan)*

### **1.1. Ajustes en creación/edición de eventos (usuario)**

* [ ] En `/dashboard/event/[id]` añadir botón **“Solicitar publicación”**
* [ ] Enviar evento a `status = PENDING` cuando el usuario lo solicite
* [ ] Desactivar auto-publicación en la creación de eventos

### **1.2. Sección de solicitudes del usuario**

* [ ] Crear: `src/app/dashboard/requests/page.tsx`
* [ ] Mostrar lista de eventos del usuario con `PENDING` o `DENIED`
* [ ] Mostrar **motivo de rechazo** leyendo `ModerationLog`
* [ ] Añadir botón **“Volver a solicitar revisión”** tras DENIED

---

# **2. Panel de ADMIN – Revisión de Eventos (moderación)**

### **2.1. Listado de revisiones**

* [x] Completar: `src/app/admin/reviews/page.tsx`
* [x] Listar eventos con `status = PENDING`
* [x] Botón **Aprobar** (`APPROVE_EVENT`)
* [x] Botón **Denegar** (`DENY_EVENT`) con campo **motivo**

  * Guardar motivo en `ModerationLog.details`
  * Cambiar `event.status = DENIED`
  * Enviar notificación al usuario (futuro)

### **2.2. Vista de detalle de evento para el admin**

* [x] Crear: `src/app/admin/reviews/[eventId]/page.tsx`
* [x] Mostrar todos los datos del evento
* [x] Mostrar reportes asociados
* [x] Mostrar logs asociados
* [x] Acciones directas (aprobar, denegar, resetear votos, ocultar/publicar)

---

# **3. Panel de ADMIN – Gestión Global de Eventos**

### **3.1. Vista general**

* [ ] Mejorar: `src/app/admin/events/page.tsx`
* [ ] Mostrar TODOS los eventos del sistema con filtros por:

  * Status (PENDING / APPROVED / DENIED)
  * isPublic
  * UserId
  * Slug
  * Rango de fechas

### **3.2. Vista de evento para admin (supervisión total)**

* [ ] Crear: `src/app/admin/events/[eventId]/page.tsx`

  * [ ] Resumen general
  * [ ] Participantes
  * [ ] Polls y Options
  * [ ] Estadísticas de votación
  * [ ] Logs de moderación
  * [ ] Reportes asociados
  * [ ] Acciones completas CRUD (editar título, descripción, slug, tags…)

### **3.3. Modo “ADMIN Impersonate”**

* [ ] Desde el panel admin, botón: **“Gestionar como creador”**
* [ ] Redirigir a `/dashboard/event/[id]` sin bloquear acceso en el middleware
* [ ] Permitir edición total aunque no sea owner

---

# **4. Panel de ADMIN – Gestión de Usuarios (CRUD completo)**

### **4.1. Listado completo de usuarios**

* [ ] Completar: `src/app/admin/users/page.tsx`

  * [ ] Filtros (role, ipBan, email, username)
  * [ ] Acciones rápidas (cambiar rol, banear IP, ver eventos)

### **4.2. Vista individual de usuario**

* [ ] Crear: `src/app/admin/users/[userId]/page.tsx`

  * [ ] Mostrar datos completos
  * [ ] Editar rol (`USER | MODERATOR | ADMIN`)
  * [ ] Toggle `ipBan`
  * [ ] Eliminar usuario (y cascada de datos)
  * [ ] Ver eventos del usuario
  * [ ] Ver reportes enviados
  * [ ] Ver logs asociados
  * [ ] Ver chats abiertos con soporte

---

# **5. Sistema de Reportes (Report + Moderation)**

### **5.1. Reportar evento desde la vista pública**

* [ ] Añadir botón “Reportar evento” en `/e/[slug]`
* [ ] Formulario para:

  * reason (`SPAM`, `SCAM`, etc.)
  * details
* [ ] Crear `Report` en BD

### **5.2. Panel de reportes**

* [ ] Completar: `src/app/admin/reports/page.tsx`

  * [ ] Lista de reportes con filtros
  * [ ] Botón “Marcar como revisado”
  * [ ] Acceso al evento y al usuario reportado
  * [ ] Acciones complementarias: `BAN_USER`, `DENY_EVENT`
  * [ ] Crear `ModerationLog` por cada acción

---

# **6. Historial de Moderación (Auditoría interna)**

### **6.1. Panel de logs**

* [ ] Crear: `src/app/admin/logs/page.tsx`
* [ ] Listar `ModerationLog` con filtros:

  * adminId
  * actionType
  * targetType
  * eventId
  * targetId
* [ ] Página de detalle opcional con historial completo

---

# **7. Sistema de Notificaciones (Notification)**

### **7.1. Notificaciones para admins**

* [ ] Crear: `src/app/admin/notifications/page.tsx`
* [ ] Mostrar notificaciones para el admin logueado
* [ ] Marcar notificación como leída
* [ ] Crear componente global:

  * `src/components/admin/AdminNotifications.tsx`

### **7.2. Disparadores internos (a implementar junto al panel)**

* [ ] Nueva solicitud de publicación → notificación Admin
* [ ] Nuevo reporte creado → notificación Admin
* [ ] Nuevo mensaje de soporte → notificación Admin

---

# **8. Sistema de Soporte (SupportChat + ChatMessage)**

### **8.1. Lado usuario**

* [ ] Crear: `src/app/dashboard/support/page.tsx`
* [ ] Crear: `src/app/dashboard/support/[chatId]/page.tsx`
* [ ] Permitir abrir un nuevo chat de soporte

### **8.2. Lado admin**

* [ ] Crear: `src/app/admin/chats/page.tsx`
* [ ] Crear: `src/app/admin/chats/[chatId]/page.tsx`
* [ ] Acciones:

  * Asignarse un chat
  * Enviar mensajes como admin
  * Cerrar chat
  * Ver historial del usuario dentro del chat

---

# **9. API interna (estructuración profesional)**

### **9.1. Endpoints para eventos**

* [ ] `src/app/api/admin/events/route.ts`
* [ ] `src/app/api/admin/events/[eventId]/route.ts`
* [ ] `src/app/api/admin/events/[eventId]/approve/route.ts`
* [ ] `src/app/api/admin/events/[eventId]/deny/route.ts`

### **9.2. Endpoints para usuarios**

* [ ] `src/app/api/admin/users/route.ts`
* [ ] `src/app/api/admin/users/[userId]/route.ts`
* [ ] `src/app/api/admin/users/[userId]/ban/route.ts`

### **9.3. Endpoints de moderación y soporte**

* [ ] `src/app/api/admin/reports/route.ts`
* [ ] `src/app/api/admin/moderation-logs/route.ts`
* [ ] `src/app/api/admin/notifications/route.ts`
* [ ] `src/app/api/support-chats/route.ts`
* [ ] `src/app/api/support-chats/[chatId]/messages/route.ts`

---

# **10. Mejoras complementarias y finales**

### **10.1. Dashboard Admin principal**

* [ ] Crear widgets en: `src/app/admin/page.tsx`

  * Nº de eventos PENDING
  * Nº de reportes sin revisar
  * Nº de chats abiertos
  * Últimas acciones de moderación

### **10.2. Seguridad y middleware**

* [ ] Asegurar que middleware detecta roles correctamente
* [ ] Añadir protección de rutas específicas para MODERATOR vs ADMIN
* [ ] Revisar IP whitelist `/admin` si lo deseas mantener