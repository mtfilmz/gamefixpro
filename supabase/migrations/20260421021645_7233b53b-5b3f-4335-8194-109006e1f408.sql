CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key boolean NOT NULL DEFAULT true UNIQUE,
  config jsonb NOT NULL DEFAULT jsonb_build_object(
    'marcas', jsonb_build_array('Sony', 'Microsoft', 'Nintendo'),
    'modelosPorMarca', jsonb_build_object(
      'Sony', jsonb_build_array('PS5', 'PS5 Digital', 'PS4 Pro', 'PS4 Slim', 'PS4', 'PS3'),
      'Microsoft', jsonb_build_array('Xbox Series X', 'Xbox Series S', 'Xbox One X', 'Xbox One S', 'Xbox One'),
      'Nintendo', jsonb_build_array('Nintendo Switch', 'Nintendo Switch OLED', 'Nintendo Switch Lite', 'Wii U', '3DS')
    ),
    'problemas', jsonb_build_array(
      'Solo Diagnóstico', 'Mantenimiento', 'No enciende', 'Daño por líquido', 'Sufrió caída',
      'Sobrecalentamiento', 'Subida de luz', 'Se apaga jugando', 'Se apaga con juegos pesados',
      'Se congela/Freezes', 'No lee discos', 'Problemas de conexión'
    ),
    'estados', jsonb_build_array('PENDIENTE', 'DIAGNÓSTICO', 'EN REPARACIÓN', 'REPARADO', 'ENTREGADO'),
    'coloresPreset', jsonb_build_array('Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Neón'),
    'accesoriosPreset', jsonb_build_array('1 Control', '2 Controles', 'Dock', 'Joy-Cons', 'Cable HDMI', 'Fuente de poder', 'Ninguno')
  ),
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert app settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.backup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key boolean NOT NULL DEFAULT true UNIQUE,
  destination_type text NOT NULL DEFAULT 'google_drive',
  destination_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  formats text[] NOT NULL DEFAULT ARRAY['json','csv'],
  data_scope text NOT NULL DEFAULT 'all',
  schedule_cron text NOT NULL DEFAULT '0 9 * * 1',
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backup settings"
ON public.backup_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert backup settings"
ON public.backup_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update backup settings"
ON public.backup_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete backup settings"
ON public.backup_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.backup_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_settings_id uuid REFERENCES public.backup_settings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  file_names text[] NOT NULL DEFAULT ARRAY[]::text[],
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.backup_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view backup runs"
ON public.backup_runs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert backup runs"
ON public.backup_runs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update backup runs"
ON public.backup_runs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete backup runs"
ON public.backup_runs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_backup_settings_updated_at
BEFORE UPDATE ON public.backup_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_backup_runs_updated_at
BEFORE UPDATE ON public.backup_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (config)
SELECT jsonb_build_object(
  'marcas', jsonb_build_array('Sony', 'Microsoft', 'Nintendo'),
  'modelosPorMarca', jsonb_build_object(
    'Sony', jsonb_build_array('PS5', 'PS5 Digital', 'PS4 Pro', 'PS4 Slim', 'PS4', 'PS3'),
    'Microsoft', jsonb_build_array('Xbox Series X', 'Xbox Series S', 'Xbox One X', 'Xbox One S', 'Xbox One'),
    'Nintendo', jsonb_build_array('Nintendo Switch', 'Nintendo Switch OLED', 'Nintendo Switch Lite', 'Wii U', '3DS')
  ),
  'problemas', jsonb_build_array(
    'Solo Diagnóstico', 'Mantenimiento', 'No enciende', 'Daño por líquido', 'Sufrió caída',
    'Sobrecalentamiento', 'Subida de luz', 'Se apaga jugando', 'Se apaga con juegos pesados',
    'Se congela/Freezes', 'No lee discos', 'Problemas de conexión'
  ),
  'estados', jsonb_build_array('PENDIENTE', 'DIAGNÓSTICO', 'EN REPARACIÓN', 'REPARADO', 'ENTREGADO'),
  'coloresPreset', jsonb_build_array('Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Neón'),
  'accesoriosPreset', jsonb_build_array('1 Control', '2 Controles', 'Dock', 'Joy-Cons', 'Cable HDMI', 'Fuente de poder', 'Ninguno')
)
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);

INSERT INTO public.backup_settings (destination_type, destination_details, formats, data_scope, schedule_cron, enabled)
SELECT 'google_drive', '{}'::jsonb, ARRAY['json','csv'], 'all', '0 9 * * 1', true
WHERE NOT EXISTS (SELECT 1 FROM public.backup_settings);