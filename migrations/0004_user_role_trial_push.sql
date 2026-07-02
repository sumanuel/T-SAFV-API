-- Migración 0004: rol global de usuario, período de prueba en asociaciones, push token

-- Rol global del usuario (ADMIN por defecto al registrarse)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS rol TEXT NOT NULL DEFAULT 'ADMIN';

-- Período de prueba a nivel de asociación
ALTER TABLE asociaciones
  ADD COLUMN IF NOT EXISTS trial_inicio TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS trial_fin TIMESTAMP WITH TIME ZONE;

-- Token de notificaciones push del dispositivo del usuario
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS push_token TEXT;
