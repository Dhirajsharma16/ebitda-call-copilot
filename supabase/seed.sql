-- ==============================================================================
-- AI EBITDA Cold Call Copilot - Crystal-Clear Sample Demo Data
-- Designed so anyone (sales reps, beginners, or executives) can easily understand.
-- ==============================================================================

-- 1. Sample Companies
INSERT INTO companies (id, company_name, website, industry, location, contact_name, contact_designation, business_challenges, revenue, operating_expenses)
VALUES
    (
        'a1111111-1111-1111-1111-111111111111',
        'RapidRoute Trucking & Fleet',
        'https://rapidroute-fleet.example.com',
        'Transportation & Logistics',
        'Dallas, TX, USA',
        'John Miller',
        'Chief Executive Officer',
        'Diesel fuel and truck maintenance consume 92% of all revenue. Operating at a tight 8% EBITDA margin where any fuel price hike wipes out net profit.',
        50000000.00,
        46000000.00
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'CloudSync Software',
        'https://cloudsync-software.example.com',
        'Enterprise Software / SaaS',
        'Boston, MA, USA',
        'David Chen',
        'VP of Sales & Operations',
        'AWS cloud server hosting costs jumped 25% YoY, threatening their 30% EBITDA margin target before the upcoming investor funding round.',
        20000000.00,
        14000000.00
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'GreenBean Coffee Cafes',
        'https://greenbean-cafes.example.com',
        'Retail & Food Chain',
        'Chicago, IL, USA',
        'Sarah Adams',
        'Chief Operating Officer',
        'Perishable dairy and coffee bean waste across 40 regional cafes is leaking $500,000/year, keeping their EBITDA margin compressed at 15%.',
        15000000.00,
        12750000.00
    ),
    (
        'd4444444-4444-4444-4444-444444444444',
        'Precision Metal Parts',
        'https://precision-metalparts.example.com',
        'Manufacturing',
        'Cleveland, OH, USA',
        'Elena Rostova',
        'Managing Director',
        'CNC machine scrap rate at 4.8% is wasting $1.2M in raw aluminum and steel. Looking to optimize production efficiency to protect a 20% margin.',
        30000000.00,
        24000000.00
    ),
    (
        'e5555555-5555-5555-5555-555555555555',
        'MetroHealth Medical Centers',
        'https://metrohealth-centers.example.com',
        'Healthcare Services',
        'Atlanta, GA, USA',
        'Dr. Robert Sterling',
        'Executive Managing Director',
        'Manual insurance billing paperwork errors cause 45-day reimbursement delays and tie up $3.5M in clinic cash flow.',
        40000000.00,
        30000000.00
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Sample Call Records
INSERT INTO call_records (id, company_id, contact_name, call_date, notes, call_outcome, follow_up_date, ai_preparation)
VALUES
    (
        'f1111111-1111-1111-1111-111111111111',
        'a1111111-1111-1111-1111-111111111111',
        'John Miller',
        NOW() - INTERVAL '2 days',
        'Spoke with CEO John. He said diesel fuel costs are eating 92% of their sales. He agreed that cutting fuel waste by 3% saves them $1.3M straight to EBITDA. Promised to send a 1-page breakdown and call him back Tuesday at 10 AM.',
        'Follow-up Required',
        NOW() - INTERVAL '1 day', -- Overdue for demo testing!
        '{"opening": "John, noticed RapidRoute expanded interstate delivery fleets—curious how you are safeguarding your 8% operating margin against diesel spikes.", "discovery": ["What is your single biggest cost driver on fuel?", "How quickly does dispatch identify route margin decay?"]}'::jsonb
    ),
    (
        'f2222222-2222-2222-2222-222222222222',
        'c3333333-3333-3333-3333-333333333333',
        'Sarah Adams',
        NOW() - INTERVAL '1 day',
        'Sarah confirmed cafe milk and food waste is costing them $500k/yr before their board meeting. Scheduled a 15-minute live demo on Thursday at 2 PM.',
        'Interested',
        NOW() + INTERVAL '3 days',
        '{"opening": "Sarah, reaching out because food chains we advise cut perishables waste by 18% to protect their 15% EBITDA margin.", "discovery": ["How much does store-level perishables waste impact your bottom line?"]}'::jsonb
    ),
    (
        'f3333333-3333-3333-3333-333333333333',
        'b2222222-2222-2222-2222-222222222222',
        'David Chen',
        NOW() - INTERVAL '4 days',
        'Executive assistant answered; David was in an investor review. Left voicemail referencing how SaaS peers cut AWS server costs by 18% to protect their 30% margin.',
        'No Answer',
        NOW() + INTERVAL '2 days',
        NULL
    ),
    (
        'f4444444-4444-4444-4444-444444444444',
        'd4444444-4444-4444-4444-444444444444',
        'Elena Rostova',
        NOW() - INTERVAL '3 days',
        'Elena wants her head of factory operations on the call. Re-scheduled for next Monday to review machine defect inspection data.',
        'Follow-up Required',
        NOW() + INTERVAL '5 days',
        NULL
    )
ON CONFLICT (id) DO NOTHING;
