-- ==============================================================================
-- AI EBITDA Cold Call Copilot - Representative Sample Demo Data
-- 3 Indian Enterprises + 2 Global/Foreigner Companies
-- ==============================================================================

-- 1. Sample Companies (3 Indian, 2 Foreigner)
INSERT INTO companies (id, company_name, website, industry, location, contact_name, contact_designation, business_challenges, revenue, operating_expenses, company_size)
VALUES
    (
        'a1111111-1111-1111-1111-111111111111',
        'K.P.R. Mill Limited',
        'https://kprmilllimited.com',
        'Spinning & Textile',
        'Coimbatore, Tamil Nadu, India',
        'K.P. Ramasamy',
        'Managing Director',
        'Tamil Nadu grid power tariff surges and raw cotton procurement price fluctuations impact spinning spread. Expanding captive solar/wind power to protect 19% EBITDA margin.',
        62480000000.00,
        50600000000.00,
        'Large'
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'Craftsman Automation Limited',
        'https://craftsmanautomation.com',
        'Auto Components & Precision Engineering',
        'Coimbatore, Tamil Nadu, India',
        'Srinivasan Ravi',
        'Managing Director',
        'High aluminum die-casting rejection rates and CNC tooling degradation across powertrain lines. Real-time machining telemetry needed to safeguard 21% EBITDA margin.',
        44500000000.00,
        35150000000.00,
        'Large'
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'Cosmo First Limited',
        'https://cosmofirst.com',
        'Packaging & Specialty Films',
        'New Delhi / Aurangabad, India',
        'Pankaj Poddar',
        'Group Chief Executive Officer',
        'Polypropylene resin price swings and ocean freight cost spikes compress export margins. Deploying line automation and scrap reduction to protect 14% EBITDA margin.',
        31200000000.00,
        26830000000.00,
        'Medium'
    ),
    (
        'd4444444-4444-4444-4444-444444444444',
        'RapidRoute Trucking & Fleet',
        'https://rapidroute-fleet.example.com',
        'Transportation & Logistics',
        'Dallas, TX, USA',
        'John Miller',
        'Chief Executive Officer',
        'Diesel fuel and truck maintenance consume 92% of all revenue. Operating at a tight 8% EBITDA margin where any fuel price hike wipes out net profit.',
        50000000.00,
        46000000.00,
        'Medium'
    ),
    (
        'e5555555-5555-5555-5555-555555555555',
        'CloudSync Software',
        'https://cloudsync-software.example.com',
        'Enterprise Software / SaaS',
        'Boston, MA, USA',
        'David Chen',
        'VP of Sales & Operations',
        'AWS cloud server hosting costs jumped 25% YoY, threatening their 30% EBITDA margin target before the upcoming investor funding round.',
        20000000.00,
        14000000.00,
        'Medium'
    )
ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    website = EXCLUDED.website,
    industry = EXCLUDED.industry,
    location = EXCLUDED.location,
    contact_name = EXCLUDED.contact_name,
    contact_designation = EXCLUDED.contact_designation,
    business_challenges = EXCLUDED.business_challenges,
    revenue = EXCLUDED.revenue,
    operating_expenses = EXCLUDED.operating_expenses,
    company_size = EXCLUDED.company_size;

-- 2. Sample Call Records
INSERT INTO call_records (id, company_id, contact_name, call_date, notes, call_outcome, follow_up_date, ai_preparation)
VALUES
    (
        'f1111111-1111-1111-1111-111111111111',
        'a1111111-1111-1111-1111-111111111111',
        'K.P. Ramasamy',
        NOW() - INTERVAL '2 days',
        'Spoke with MD K.P. Ramasamy regarding power cost optimization across their Coimbatore spinning units. He mentioned captive solar/wind is mitigating grid tariff hikes but spindle telemetry can save another 2.5% in operating costs. Scheduled follow-up next Tuesday.',
        'Follow-up Required',
        NOW() - INTERVAL '1 day', -- Overdue for demo inspection
        '{"opening": "Hi Mr. Ramasamy, noticed K.P.R. Mill is commissioning captive renewable capacity in Tamil Nadu—curious how your team is safeguarding your 19% spinning margin against rising grid tariffs this fiscal.", "discovery": ["What percentage of your operating cost per kg of yarn is currently driven by power tariffs?", "How quickly does mill leadership spot energy leakage across your spindle frames?"]}'::jsonb
    ),
    (
        'f2222222-2222-2222-2222-222222222222',
        'b2222222-2222-2222-2222-222222222222',
        'Srinivasan Ravi',
        NOW() - INTERVAL '1 day',
        'Discussed CNC machining scrap reduction and casting yield in their Coimbatore plants. Ravi was very receptive to benchmark data and requested a 15-minute diagnostic session for their plant engineering head.',
        'Interested',
        NOW() + INTERVAL '3 days',
        '{"opening": "Hi Mr. Ravi, reaching out because auto-component leaders in Coimbatore are utilizing real-time tool telemetry to prevent raw aluminum scrap from eroding their 21% EBITDA margin.", "discovery": ["What is your current scrap and rework rate across powertrain cylinder blocks?", "How is raw aluminum price volatility impacting your OEM supply contracts?"]}'::jsonb
    ),
    (
        'f3333333-3333-3333-3333-333333333333',
        'd4444444-4444-4444-4444-444444444444',
        'John Miller',
        NOW() - INTERVAL '2 days',
        'Spoke with CEO John. He said diesel fuel costs are eating 92% of their sales. He agreed that cutting fuel waste by 3% saves them $1.3M straight to EBITDA. Promised to send a 1-page breakdown and call him back Tuesday at 10 AM.',
        'Follow-up Required',
        NOW() + INTERVAL '4 days',
        '{"opening": "John, noticed RapidRoute expanded interstate delivery fleets—curious how you are safeguarding your 8% operating margin against diesel spikes.", "discovery": ["What is your single biggest cost driver on fuel?", "How quickly does dispatch identify route margin decay?"]}'::jsonb
    ),
    (
        'f4444444-4444-4444-4444-444444444444',
        'e5555555-5555-5555-5555-555555555555',
        'David Chen',
        NOW() - INTERVAL '4 days',
        'Executive assistant answered; David was in an investor review. Left voicemail referencing how SaaS peers cut AWS server costs by 18% to protect their 30% margin.',
        'No Answer',
        NOW() + INTERVAL '2 days',
        NULL
    ),
    (
        'f5555555-5555-5555-5555-555555555555',
        'c3333333-3333-3333-3333-333333333333',
        'Pankaj Poddar',
        NOW() - INTERVAL '3 days',
        'Brief chat with executive office. CEO Pankaj Poddar agreed to review a 1-page efficiency model on BOPP barrier film resin yields next Thursday.',
        'Follow-up Required',
        NOW() + INTERVAL '6 days',
        NULL
    )
ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    contact_name = EXCLUDED.contact_name,
    notes = EXCLUDED.notes,
    call_outcome = EXCLUDED.call_outcome,
    follow_up_date = EXCLUDED.follow_up_date;
