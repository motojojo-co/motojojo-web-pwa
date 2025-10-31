-- Host Spaces Management System
-- Allows hosts to provide their spaces for events

-- 1. Create host_spaces table
CREATE TABLE IF NOT EXISTS public.host_spaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    images TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of image URLs (like Airbnb)
    capacity INTEGER,
    amenities TEXT[], -- Array of amenities (e.g., ['wifi', 'parking', 'kitchen'])
    available_dates DATE[], -- Array of available dates
    available_start_time TIME, -- Start time for availability
    available_end_time TIME, -- End time for availability
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(host_id, name)
);

-- 2. Create host_event_requests table for hosts to request events at their spaces
CREATE TABLE IF NOT EXISTS public.host_event_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_space_id UUID NOT NULL REFERENCES public.host_spaces(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT,
    requested_date DATE NOT NULL,
    requested_start_time TIME NOT NULL,
    requested_end_time TIME,
    expected_capacity INTEGER,
    event_category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'scheduled')),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_event_id UUID REFERENCES public.events(id), -- If an event was created from this request
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.host_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_event_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for host_spaces
CREATE POLICY "Hosts can view their own spaces" ON public.host_spaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.hosts h
            WHERE h.id = host_spaces.host_id 
            AND h.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Hosts can create their own spaces" ON public.host_spaces
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.hosts h
            WHERE h.id = host_spaces.host_id 
            AND h.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Hosts can update their own spaces" ON public.host_spaces
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.hosts h
            WHERE h.id = host_spaces.host_id 
            AND h.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view all host spaces" ON public.host_spaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all host spaces" ON public.host_spaces
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Community leads can view approved host spaces" ON public.host_spaces
    FOR SELECT USING (
        status = 'approved' AND (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'community_lead'
            )
        )
    );

-- 5. RLS Policies for host_event_requests
CREATE POLICY "Hosts can view their own event requests" ON public.host_event_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.hosts h
            WHERE h.id = host_event_requests.host_id 
            AND h.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Hosts can create event requests for their spaces" ON public.host_event_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.hosts h
            JOIN public.host_spaces hs ON h.id = hs.host_id
            WHERE h.id = host_event_requests.host_id 
            AND h.user_id = auth.uid()::text
            AND hs.id = host_event_requests.host_space_id
        )
    );

CREATE POLICY "Hosts can update their own event requests" ON public.host_event_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.hosts h
            WHERE h.id = host_event_requests.host_id 
            AND h.user_id = auth.uid()::text
        ) AND status = 'pending'
    );

CREATE POLICY "Admins can view all event requests" ON public.host_event_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all event requests" ON public.host_event_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Community leads can view event requests" ON public.host_event_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'community_lead'
        )
    );

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_host_spaces_host_id ON public.host_spaces(host_id);
CREATE INDEX IF NOT EXISTS idx_host_spaces_status ON public.host_spaces(status);
CREATE INDEX IF NOT EXISTS idx_host_spaces_city ON public.host_spaces(city);
CREATE INDEX IF NOT EXISTS idx_host_event_requests_host_id ON public.host_event_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_host_event_requests_host_space_id ON public.host_event_requests(host_space_id);
CREATE INDEX IF NOT EXISTS idx_host_event_requests_status ON public.host_event_requests(status);
CREATE INDEX IF NOT EXISTS idx_host_event_requests_date ON public.host_event_requests(requested_date);

-- 7. Create triggers for updated_at
CREATE TRIGGER update_host_spaces_updated_at 
    BEFORE UPDATE ON public.host_spaces 
    FOR EACH ROW 
    EXECUTE FUNCTION update_users_updated_at_column();

CREATE TRIGGER update_host_event_requests_updated_at 
    BEFORE UPDATE ON public.host_event_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_users_updated_at_column();

-- 8. Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.host_spaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.host_event_requests;

-- 9. Function to approve/reject host space
CREATE OR REPLACE FUNCTION approve_host_space(
    space_id UUID,
    approval_status VARCHAR(20),
    rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    space_record RECORD;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only admins can approve/reject host spaces'
        );
    END IF;

    -- Get space record
    SELECT * INTO space_record
    FROM public.host_spaces
    WHERE id = space_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Host space not found'
        );
    END IF;

    -- Update space status
    UPDATE public.host_spaces
    SET 
        status = approval_status,
        approved_by = CASE WHEN approval_status = 'approved' THEN auth.uid() ELSE NULL END,
        approved_at = CASE WHEN approval_status = 'approved' THEN NOW() ELSE NULL END,
        rejection_reason = CASE WHEN approval_status = 'rejected' THEN rejection_reason ELSE NULL END,
        updated_at = NOW()
    WHERE id = space_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Host space ' || approval_status || ' successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 10. Function to approve/reject event request
CREATE OR REPLACE FUNCTION approve_event_request(
    request_id UUID,
    approval_status VARCHAR(20),
    rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    request_record RECORD;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only admins can approve/reject event requests'
        );
    END IF;

    -- Get request record
    SELECT * INTO request_record
    FROM public.host_event_requests
    WHERE id = request_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Event request not found'
        );
    END IF;

    -- Update request status
    UPDATE public.host_event_requests
    SET 
        status = approval_status,
        approved_by = CASE WHEN approval_status IN ('approved', 'scheduled') THEN auth.uid() ELSE NULL END,
        approved_at = CASE WHEN approval_status IN ('approved', 'scheduled') THEN NOW() ELSE NULL END,
        rejection_reason = CASE WHEN approval_status = 'rejected' THEN rejection_reason ELSE NULL END,
        updated_at = NOW()
    WHERE id = request_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Event request ' || approval_status || ' successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- 11. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.host_spaces TO authenticated;
GRANT ALL ON public.host_event_requests TO authenticated;

-- 12. Add comments
COMMENT ON TABLE public.host_spaces IS 'Stores host spaces/locations available for events';
COMMENT ON TABLE public.host_event_requests IS 'Stores host requests for events at their spaces';
COMMENT ON FUNCTION approve_host_space IS 'Admin function to approve or reject host spaces';
COMMENT ON FUNCTION approve_event_request IS 'Admin function to approve or reject event requests';

