# Arquitectura recomendada para producción

## Frontend
- Next.js (App Router) + TypeScript
- Tailwind CSS con tokens de marca
- Componentes accesibles y renderizado híbrido
- Internacionalización ES/EN

## Backend
- Supabase Auth
- PostgreSQL / Row Level Security
- Supabase Storage para galerías
- Edge Functions para moderación, notificaciones y asistencia IA

## Entidades principales
- users
- cultural_profiles
- cultural_posts
- profile_links
- follows
- favorites
- verification_requests
- reports
- cultural_passport_entries
- categories

## Seguridad cultural
- Consentimiento explícito para imágenes e historias.
- Visibilidad granular del contenido.
- Trazabilidad de ediciones y aprobaciones.
- Moderación y reportes.
- La IA no afirma pertenencia, linaje, rituales o saberes no declarados.
