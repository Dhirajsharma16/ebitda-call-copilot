-- ==============================================================================
-- AI EBITDA Cold Call Copilot - Realistic Sample Demo Data
-- Labelled as [SAMPLE DEMO DATA] for testing & evaluation
-- ==============================================================================

-- 1. Sample Companies
INSERT INTO companies (id, company_name, website, industry, location, contact_name, contact_designation, business_challenges, revenue, operating_expenses)
VALUES
    (
        'a1111111-1111-1111-1111-111111111111',
        'Apex Industrial Logistics Corp',
        'https://apex-logistics.example.com',
        'Transportation & Logistics',
        'Dallas, TX, USA',
        'Marcus Vance',
        'Chief Executive Officer',
        'Fleet fuel and maintenance expenses surging by 18% YoY. Operating under compressed margins due to driver retention bonuses and inefficient route dispatch.',
        42500000.00,
        38250000.00
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        'Vanguard Precision Machining',
        'https://vanguard-precision.example.com',
        'Manufacturing',
        'Cleveland, OH, USA',
        'Elena Rostova',
        'Managing Director',
        'High scrap rates (4.8%) on CNC lines and bottlenecked inventory holding costs. Looking to protect EBITDA before upcoming private equity sponsor review.',
        28000000.00,
        22400000.00
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'Synapse Cloud Systems',
        'https://synapsecloud.example.com',
        'Enterprise Software / B2B SaaS',
        'Boston, MA, USA',
        'David Chen',
        'VP of Sales & Operations',
        'Customer acquisition costs (CAC) jumped 25% while net revenue retention declined to 102%. Heavy AWS infrastructure spend eroding gross margins.',
        15600000.00,
        11200000.00
    ),
    (
        'd4444444-4444-4444-4444-444444444444',
        'Heritage Food Distributors',
        'https://heritagefoods.example.com',
        'Wholesale Distribution',
        'Chicago, IL, USA',
        'Sarah Jenkins',
        'Chief Operating Officer',
        'Cold-chain storage electricity spikes and perishable spoilage rate at 3.2%. Operating margin under 5% with high debt service burdens.',
        65000000.00,
        61750000.00
    ),
    (
        'e5555555-5555-5555-5555-555555555555',
        'OmniCare Regional Diagnostics',
        'https://omnicarediagnostics.example.com',
        'Healthcare Services',
        'Atlanta, GA, USA',
        'Dr. Robert Sterling',
        'Executive Managing Director',
        'Administrative billing errors leading to 45-day delay in reimbursements and 12% revenue leakage in lab intake operations.',
        32000000.00,
        24000000.00
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Sample Call Records
INSERT INTO call_records (id, company_id, contact_name, call_date, notes, call_outcome, follow_up_date, ai_preparation)
VALUES
    (
        'f1111111-1111-1111-1111-111111111111',
        'a1111111-1111-1111-1111-111111111111',
        'Marcus Vance',
        NOW() - INTERVAL '3 days',
        'Discussed fleet operating cost compression. Marcus confirmed that dispatch telemetry is siloed across 3 legacy systems. He is open to a 20-minute executive briefing on AI telemetry consolidation.',
        'Follow-up Required',
        NOW() - INTERVAL '1 day', -- Overdue for demo testing!
        '{"opening": "Marcus, noticed Apex expanded fleet routes across the south corridor—curious how you are safeguarding your 10% operating margins against diesel spikes.", "discovery": ["What is your biggest cost driver right now?", "How quickly does dispatch identify route margin decay?"]}'::jsonb
    ),
    (
        'f2222222-2222-2222-2222-222222222222',
        'b2222222-2222-2222-2222-222222222222',
        'Elena Rostova',
        NOW() - INTERVAL '1 day',
        'Elena is preparing for PE board meeting next month. CNC scrap reduction directly impacts her EBITDA target. Sent over brief, she requested calendar invite for next Tuesday.',
        'Interested',
        NOW() + INTERVAL '4 days',
        '{"opening": "Elena, reaching out because several Tier-1 precision manufacturers we work with used predictive quality analytics to recover 150-200 bps of EBITDA.", "discovery": ["How much does material scrap factor into your unit economics?"]}'::jsonb
    ),
    (
        'f3333333-3333-3333-3333-333333333333',
        'c3333333-3333-3333-3333-333333333333',
        'David Chen',
        NOW() - INTERVAL '5 days',
        'Gatekeeper answered, David was in an all-day executive offsite. Left a voicemail referencing cloud cost optimization benchmarking.',
        'No Answer',
        NOW() + INTERVAL '2 days',
        null
    ),
    (
        'f4444444-4444-4444-4444-444444444444',
        'd4444444-4444-4444-4444-444444444444',
        'Sarah Jenkins',
        NOW() - INTERVAL '10 days',
        'Sarah stated they just signed a 3-year enterprise contract with a legacy supply chain vendor last month. Not reviewing vendors this fiscal year.',
        'Not Interested',
        null,
        null
    )
ON CONFLICT (id) DO NOTHING;
