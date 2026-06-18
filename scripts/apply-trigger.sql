-- 1. Create or replace the trigger function to calculate visitor metrics
CREATE OR REPLACE FUNCTION public.calculate_visitor_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_lead_score INT := 0;
    v_intent TEXT := 'Window Shopper';
    v_interest TEXT := 'General';
    v_menu_views INT := 0;
    v_gallery_views INT := 0;
    v_has_booking BOOLEAN := FALSE;
BEGIN
    -- 1. Compute Lead Score
    -- Get count of different event types for the visitor
    SELECT 
        COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) * 1 +
        COUNT(CASE WHEN event_type = 'menu_view' THEN 1 END) * 5 +
        COUNT(CASE WHEN event_type = 'gallery_view' THEN 1 END) * 5 +
        COUNT(CASE WHEN event_type = 'heartbeat' THEN 1 END) * 2 +
        COUNT(CASE WHEN event_type = 'reservation_start' THEN 1 END) * 15 +
        COUNT(CASE WHEN event_type = 'whatsapp_click' THEN 1 END) * 15 +
        COUNT(CASE WHEN event_type = 'reservation_complete' THEN 1 END) * 100
    INTO v_lead_score
    FROM public.intelligence_events
    WHERE visitor_id = NEW.visitor_id;

    -- 2. Classify Intent
    IF v_lead_score >= 100 THEN
        v_intent := 'Converted';
    ELSIF v_lead_score >= 50 THEN
        v_intent := 'Hot Lead';
    ELSIF v_lead_score >= 20 THEN
        v_intent := 'Warm Lead';
    ELSE
        v_intent := 'Window Shopper';
    END IF;

    -- 3. Determine Primary Interest
    SELECT 
        COUNT(CASE WHEN event_type = 'menu_view' THEN 1 END),
        COUNT(CASE WHEN event_type = 'gallery_view' THEN 1 END),
        EXISTS(SELECT 1 FROM public.intelligence_events WHERE visitor_id = NEW.visitor_id AND event_type IN ('reservation_start', 'reservation_complete'))
    INTO v_menu_views, v_gallery_views, v_has_booking
    FROM public.intelligence_events
    WHERE visitor_id = NEW.visitor_id;

    IF v_has_booking THEN
        v_interest := 'Events / Groups';
    ELSIF v_menu_views > v_gallery_views THEN
        v_interest := 'Foodie';
    ELSIF v_gallery_views > 0 THEN
        v_interest := 'Ambiance / Events';
    ELSE
        v_interest := 'General Interest';
    END IF;

    -- 4. Update intelligence_visitors table
    UPDATE public.intelligence_visitors
    SET 
        lead_score = v_lead_score,
        intent_classification = v_intent,
        primary_interest = v_interest
    WHERE id = NEW.visitor_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger to execute AFTER INSERT on public.intelligence_events
DROP TRIGGER IF EXISTS trigger_calculate_visitor_metrics ON public.intelligence_events;
CREATE TRIGGER trigger_calculate_visitor_metrics
AFTER INSERT ON public.intelligence_events
FOR EACH ROW
EXECUTE FUNCTION public.calculate_visitor_metrics();
