'use client';

import { useState } from 'react';
import { Users, TrendingUp, MapPin, Search, Target, Monitor, Share2, MousePointer2, Clock, Filter, Activity, Download, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AdminIntelligenceClient({ initialVisitors, initialSessions, initialEvents = [] }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitorId, setSelectedVisitorId] = useState(null);

  // Derived metrics
  const totalVisitors = initialVisitors.length;
  const totalSessions = initialSessions.length;
  const avgDuration = totalSessions > 0 ? Math.round(initialSessions.reduce((acc, s) => acc + s.duration_seconds, 0) / totalSessions) : 0;
  const highIntentCount = initialVisitors.filter(v => v.lead_score >= 50).length;

  const sources = initialSessions.reduce((acc, s) => {
    const src = s.traffic_source || 'Direct';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  const sourceData = Object.keys(sources).map(k => ({ name: k, value: sources[k] }));
  const COLORS = ['#d4af37', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

  const deviceData = [
    { name: 'Mobile', value: initialVisitors.filter(v => v.device_type === 'Mobile').length },
    { name: 'Desktop', value: initialVisitors.filter(v => v.device_type === 'Desktop').length },
    { name: 'Tablet', value: initialVisitors.filter(v => v.device_type === 'Tablet').length }
  ].filter(d => d.value > 0);

  const filteredVisitors = initialVisitors.filter(v => 
    v.id.includes(searchTerm) || 
    (v.primary_interest && v.primary_interest.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (v.intent_classification && v.intent_classification.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (v.geo_city && v.geo_city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getScoreColor = (score) => {
    if (score >= 100) return '#10b981';
    if (score >= 50) return '#ef4444';
    if (score >= 20) return '#eab308';
    return '#3b82f6';
  };

  const statCardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  };

  const exportToCSV = (audienceName) => {
    const list = initialVisitors.filter(v => 
      audienceName === 'hot' ? (v.lead_score >= 50 && v.lead_score < 100) :
      audienceName === 'foodies' ? v.primary_interest === 'Foodie' :
      (v.primary_interest === 'Events / Groups' || v.primary_interest === 'Ambiance / Events')
    );

    const headers = "Visitor ID,Device,City,Country,Lead Score,Intent\n";
    const csv = list.map(v => `${v.id},${v.device_type},${v.geo_city || 'Unknown'},${v.geo_country || 'Unknown'},${v.lead_score},${v.intent_classification}`).join("\n");
    
    const blob = new Blob([headers + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yako_audience_${audienceName}.csv`;
    a.click();
  };

  const renderVisitorModal = () => {
    if (!selectedVisitorId) return null;
    const visitor = initialVisitors.find(v => v.id === selectedVisitorId);
    const visitorEvents = initialEvents.filter(e => e.visitor_id === selectedVisitorId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div className="glass" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative' }}>
          <button onClick={() => setSelectedVisitorId(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
          
          <h2 style={{ marginBottom: '5px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {visitor.dummy_name || 'Anonymous Visitor'} 
            {visitor.total_visits > 1 && <span style={{ fontSize: '0.8rem', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>Returning</span>}
          </h2>
          <p style={{ color: '#A1A1AA', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '20px' }}>ID: {visitor.id} | Fingerprint: {visitor.fingerprint ? visitor.fingerprint.substring(0,8) : 'N/A'}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ color: '#A1A1AA', fontSize: '0.9rem', marginBottom: '5px' }}>Classification</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: getScoreColor(visitor.lead_score) }}>{visitor.intent_classification || 'Analyzing...'}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ color: '#A1A1AA', fontSize: '0.9rem', marginBottom: '5px' }}>Location</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{visitor.geo_city ? `${visitor.geo_city}, ${visitor.geo_country}` : 'Unknown'}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ color: '#A1A1AA', fontSize: '0.9rem', marginBottom: '5px' }}>Lead Score</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{visitor.lead_score} points</div>
            </div>
          </div>

          <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--primary)' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--primary)', marginBottom: '4px' }}>Microsoft Clarity Integration</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#A1A1AA' }}>Search for <strong>{visitor.dummy_name}</strong> in Clarity to watch their screen recordings.</p>
            </div>
            <a href="https://clarity.microsoft.com" target="_blank" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.9rem' }}>Open Clarity</a>
          </div>

          <h3 style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}><Activity size={18} style={{ display: 'inline', marginRight: '8px' }}/> Chronological Clickstream</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {visitorEvents.length > 0 ? visitorEvents.map((evt) => {
              const type = evt.event_type;
              const path = evt.event_data?.path || '';
              let actionText = type.replace('_', ' ');
              let icon = '🖱️';

              if (type === 'page_view') { actionText = `Viewed the ${path === '/' ? 'Home' : path.replace('/','')} page`; icon = '📄'; }
              if (type === 'menu_view') { actionText = `Browsed the Food Menu`; icon = '🍽️'; }
              if (type === 'gallery_view') { actionText = `Looked at the Restaurant Gallery`; icon = '📸'; }
              if (type === 'reservation_start') { actionText = `Started a Table Reservation`; icon = '📅'; }
              if (type === 'reservation_complete') { actionText = `Successfully Booked a Table!`; icon = '✅'; }
              if (type === 'whatsapp_click') { actionText = `Clicked to Chat on WhatsApp`; icon = '💬'; }
              if (type === 'call_click') { actionText = `Clicked to Call the Restaurant`; icon = '📞'; }
              if (type === 'heartbeat') { actionText = `Still active on ${path === '/' ? 'Home' : path.replace('/','')} page`; icon = '⏱️'; }

              return (
                <div key={evt.id} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#A1A1AA', fontSize: '0.85rem', width: '80px', paddingTop: '3px' }}>
                    {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '8px', borderLeft: `3px solid ${type.includes('reservation') ? '#10b981' : 'var(--primary)'}` }}>
                    <div style={{ fontWeight: 500 }}>{icon} {actionText}</div>
                  </div>
                </div>
              );
            }) : (
              <p style={{ color: '#A1A1AA' }}>No recent events found.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="font-script" style={{ fontSize: '3rem' }}>Customer Intelligence</h1>
        <div style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.9rem' }}>
          Microsoft Clarity Integration Active
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <button onClick={() => setActiveTab('overview')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'overview' ? '#fff' : '#A1A1AA', fontWeight: activeTab === 'overview' ? 600 : 400, paddingBottom: '1rem', borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-1rem' }}>
          Overview
        </button>
        <button onClick={() => setActiveTab('crm')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'crm' ? '#fff' : '#A1A1AA', fontWeight: activeTab === 'crm' ? 600 : 400, paddingBottom: '1rem', borderBottom: activeTab === 'crm' ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-1rem' }}>
          Visitor CRM & Lead Scores
        </button>
        <button onClick={() => setActiveTab('marketing')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'marketing' ? '#fff' : '#A1A1AA', fontWeight: activeTab === 'marketing' ? 600 : 400, paddingBottom: '1rem', borderBottom: activeTab === 'marketing' ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-1rem' }}>
          Marketing & ROI
        </button>
        <button onClick={() => setActiveTab('audiences')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeTab === 'audiences' ? '#fff' : '#A1A1AA', fontWeight: activeTab === 'audiences' ? 600 : 400, paddingBottom: '1rem', borderBottom: activeTab === 'audiences' ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-1rem' }}>
          Audiences / Segments
        </button>
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={statCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#A1A1AA' }}>
                <Users size={18} /> Unique Visitors
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600 }}>{totalVisitors}</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#A1A1AA' }}>
                <TrendingUp size={18} /> Total Sessions
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600 }}>{totalSessions}</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#A1A1AA' }}>
                <Target size={18} /> Warm/Hot Leads
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: '#ef4444' }}>{highIntentCount}</div>
            </div>
            <div style={statCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#A1A1AA' }}>
                <MapPin size={18} /> Top City
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {initialVisitors.filter(v => v.geo_city).length > 0 ? initialVisitors.filter(v => v.geo_city)[0].geo_city : 'Tracking...'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Conversion Funnel Widget */}
            <div className="glass" style={{ padding: '30px' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Filter size={20} /> Conversion Funnel</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>1. Total Traffic</span>
                  <span style={{ fontWeight: 600 }}>{totalVisitors}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', marginLeft: '20px' }}>
                  <span>2. Viewed Menu / Engaged</span>
                  <span style={{ fontWeight: 600 }}>{initialVisitors.filter(v => v.lead_score >= 5).length}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', marginLeft: '40px' }}>
                  <span>3. High Booking Intent (&gt;50 score)</span>
                  <span style={{ fontWeight: 600 }}>{highIntentCount}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', marginLeft: '60px', border: '1px solid var(--primary)' }}>
                  <span style={{ color: 'var(--primary)' }}>4. Conversion (Booked/Contacted)</span>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{initialVisitors.filter(v => v.lead_score >= 100).length}</span>
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: '30px' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}><MousePointer2 size={20} /> Visual Heatmaps</h3>
              <p style={{ color: '#A1A1AA', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                We have integrated Microsoft Clarity into the platform. It is currently silently recording all visitor mouse movements, scroll depth, and clicks.
              </p>
              <a href="https://clarity.microsoft.com" target="_blank" className="btn-outline" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Open Clarity Dashboard
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'crm' && (
        <div className="glass" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3>Visitor CRM Directory</h3>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#A1A1AA' }} />
              <input 
                type="text" 
                placeholder="Search by City or Intent..." 
                className="glass-input" 
                style={{ paddingLeft: '35px', width: '300px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#A1A1AA', fontSize: '0.9rem' }}>
                <th style={{ padding: '12px' }}>Visitor ID</th>
                <th style={{ padding: '12px' }}>Location</th>
                <th style={{ padding: '12px' }}>Device</th>
                <th style={{ padding: '12px' }}>Predicted Intent</th>
                <th style={{ padding: '12px' }}>Lead Score</th>
                <th style={{ padding: '12px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => setSelectedVisitorId(v.id)}>
                  <td style={{ padding: '16px 12px', fontWeight: 500, color: 'var(--primary)' }}>{v.dummy_name || `...${v.id.substring(24)}`}</td>
                  <td style={{ padding: '16px 12px' }}>{v.geo_city || 'Unknown'}</td>
                  <td style={{ padding: '16px 12px' }}>{v.device_type === 'Mobile' ? '📱' : '💻'} {v.os}</td>
                  <td style={{ padding: '16px 12px', fontWeight: 500, color: getScoreColor(v.lead_score) }}>{v.intent_classification || 'Window Shopper'}</td>
                  <td style={{ padding: '16px 12px', fontWeight: 600 }}>{v.lead_score}</td>
                  <td style={{ padding: '16px 12px' }}><button className="btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>View Profile</button></td>
                </tr>
              ))}
              {filteredVisitors.length === 0 && (
                <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#A1A1AA' }}>No visitors matched.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'marketing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="glass" style={{ padding: '30px' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Share2 size={20} /> Traffic Sources</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={sourceData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#000', border: '1px solid #333' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass" style={{ padding: '30px' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Monitor size={20} /> Device Usage</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={deviceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#A1A1AA" />
                    <YAxis stroke="#A1A1AA" />
                    <Tooltip contentStyle={{ background: '#000', border: '1px solid #333' }} />
                    <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audiences' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div className="glass" style={{ padding: '30px', textAlign: 'center', borderTop: '4px solid #ef4444' }}>
              <h3 style={{ marginBottom: '10px' }}>🔥 Hot Leads</h3>
              <p style={{ color: '#A1A1AA', fontSize: '0.9rem', marginBottom: '20px' }}>High engagement, clicked contact but didn't book.</p>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '20px' }}>{initialVisitors.filter(v => v.lead_score >= 50 && v.lead_score < 100).length}</div>
              <button onClick={() => exportToCSV('hot')} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <Download size={16} /> Export CSV
              </button>
            </div>
            <div className="glass" style={{ padding: '30px', textAlign: 'center', borderTop: '4px solid var(--primary)' }}>
              <h3 style={{ marginBottom: '10px' }}>🍽️ Foodies</h3>
              <p style={{ color: '#A1A1AA', fontSize: '0.9rem', marginBottom: '20px' }}>Spent most of their time browsing the menu.</p>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '20px' }}>{initialVisitors.filter(v => v.primary_interest === 'Foodie').length}</div>
              <button onClick={() => exportToCSV('foodies')} className="btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <Download size={16} /> Export CSV
              </button>
            </div>
            <div className="glass" style={{ padding: '30px', textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
              <h3 style={{ marginBottom: '10px' }}>🏢 Corporate/Events</h3>
              <p style={{ color: '#A1A1AA', fontSize: '0.9rem', marginBottom: '20px' }}>High engagement on Gallery and Contact pages.</p>
              <div style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '20px' }}>{initialVisitors.filter(v => v.primary_interest === 'Events / Groups' || v.primary_interest === 'Ambiance / Events').length}</div>
              <button onClick={() => exportToCSV('events')} className="btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>
          
          <div className="glass" style={{ padding: '20px' }}>
            <p style={{ color: '#A1A1AA', fontSize: '0.9rem' }}>
              <strong>How to use exports:</strong> You can download these CSV files and upload them directly to Facebook Ads or Google Ads as a "Custom Audience". This allows you to show highly targeted ads (e.g. showing a private hire ad specifically to the "Corporate/Events" segment) which drastically reduces your marketing costs.
            </p>
          </div>
        </div>
      )}

      {renderVisitorModal()}
    </div>
  );
}
