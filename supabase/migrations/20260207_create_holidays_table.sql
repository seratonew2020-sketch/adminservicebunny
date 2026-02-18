-- Create Holidays Table
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT CHECK (type IN ('public', 'company', 'vacation', 'other')),
    
    -- Optional: Link to employee if it's a personal holiday/leave
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    
    -- Requester Name (as explicitly requested)
    requester_name TEXT,
    
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Grant Permissions
GRANT ALL ON TABLE public.holidays TO anon, authenticated, service_role;

-- Policies (Permissive for now to ensure it works, similar to previous fix)
CREATE POLICY "Enable all access for authenticated users" ON public.holidays
FOR ALL USING (auth.role() = 'authenticated');

-- Also allow public read if needed (optional)
CREATE POLICY "Enable read access for anon" ON public.holidays
FOR SELECT USING (true);
