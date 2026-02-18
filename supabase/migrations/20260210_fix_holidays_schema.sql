-- Re-create holidays table to ensure correct schema (Fix for missing start_date/end_date columns)
DROP TABLE IF EXISTS public.holidays;

CREATE TABLE public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT CHECK (type IN ('public', 'company', 'vacation', 'other')),
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    requester_name TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Grant Permissions
GRANT ALL ON TABLE public.holidays TO anon, authenticated, service_role;

-- Policies
CREATE POLICY "Enable all access for authenticated users" ON public.holidays
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for anon" ON public.holidays
FOR SELECT USING (true);
