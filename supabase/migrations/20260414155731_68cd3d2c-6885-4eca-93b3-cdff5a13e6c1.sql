
CREATE TABLE public.repairs (
  id TEXT NOT NULL PRIMARY KEY,
  cliente TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  marca TEXT NOT NULL DEFAULT '',
  consola TEXT NOT NULL DEFAULT '',
  numero_serie TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  accesorios TEXT NOT NULL DEFAULT '',
  problemas TEXT[] NOT NULL DEFAULT '{}',
  detalles TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'PENDIENTE',
  fecha TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD'),
  historial JSONB NOT NULL DEFAULT '[]',
  imagenes JSONB NOT NULL DEFAULT '[]',
  costo_diagnostico NUMERIC,
  costo_reparacion NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.repairs FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.repairs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.repairs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.repairs FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.repairs;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_repairs_updated_at
  BEFORE UPDATE ON public.repairs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
