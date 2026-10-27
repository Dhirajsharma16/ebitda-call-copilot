'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Clock, 
  Search, 
  Filter, 
  Calendar, 
  PhoneCall, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  User, 
  Edit, 
  Trash2,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { api } from '@/lib/api';
import { CallRecord, CallOutcome, FollowUpSummary } from '@/lib/types';

function CallsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'followups' ? 'followups' : 'history';

  const [activeTab, setActiveTab] = useState<'history' | 'followups'>(initialTab);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');

  // Edit Modal/Drawer State
  const [editingCall, setEditingCall] = useState<CallRecord | null>(null);
  const [newOutcome, setNewOutcome] = useState<CallOutcome>('Follow-up Required');
  const [newFollowUpDate, setNewFollowUpDate] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCalls, fUps] = await Promise.all([
        api.getCalls(),
        api.getFollowUps()
      ]);
      setCalls(allCalls);
      setFollowUps(fUps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (call: CallRecord) => {
    setEditingCall(call);
    setNewOutcome(call.call_outcome);
    setNewFollowUpDate(call.follow_up_date ? call.follow_up_date.split('T')[0] : '');
    setNewNotes(call.notes || '');
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCall) return;

    setUpdating(true);
    try {
      const updated = await api.updateCall(editingCall.id, {
        call_outcome: newOutcome,
        follow_up_date: newFollowUpDate ? new Date(newFollowUpDate).toISOString() : null,
        notes: newNotes,
      });

      setCalls(calls.map(c => c.id === updated.id ? updated : c));
      // Refresh follow ups
      const fUps = await api.getFollowUps();
      setFollowUps(fUps);

      setEditingCall(null);
    } catch (e) {
      console.error(e);
      alert('Failed to update call record.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCall = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this call log?')) return;
    try {
      await api.deleteCall(id);
      setCalls(calls.filter(c => c.id !== id));
      const fUps = await api.getFollowUps();
      setFollowUps(fUps);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCalls = calls.filter((c) => {
    const matchesSearch = !search || (
      (c.company_name && c.company_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.contact_name && c.contact_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()))
    );
    const matchesOutcome = outcomeFilter === 'all' || c.call_outcome === outcomeFilter;
    return matchesSearch && matchesOutcome;
  });

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'Interested':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'Follow-up Required':
        return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
      case 'Not Interested':
        return 'bg-slate-700/40 text-slate-400 border border-slate-600/30';
      case 'No Answer':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Call History & Follow-ups
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review past sales conversations, track deal progression, and manage pending follow-ups.
          </p>
        </div>

        <Link
          href="/workspace"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <PhoneCall className="w-4 h-4" />
          <span>New Call Session</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>All Call Records</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 font-mono">
            {calls.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('followups')}
          className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'followups'
              ? 'border-amber-500 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <span>Scheduled Follow-ups</span>
          {followUps && followUps.total_pending > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full font-mono ${
              followUps.overdue_count > 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
            }`}>
              {followUps.total_pending}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ALL CALL RECORDS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes, company, or contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 shrink-0">Outcome:</span>
              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="w-full sm:w-auto text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Outcomes</option>
                <option value="Interested">Interested</option>
                <option value="Follow-up Required">Follow-up Required</option>
                <option value="Not Interested">Not Interested</option>
                <option value="No Answer">No Answer</option>
              </select>
            </div>
          </div>

          {/* Calls List */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Loading call logs...
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No call logs found matching your filter criteria.</p>
              <Link
                href="/workspace"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
              >
                Start a New Call Session
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCalls.map((call) => (
                <div
                  key={call.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Link
                          href={`/companies/${call.company_id}`}
                          className="font-bold text-white hover:text-blue-400 transition-colors"
                        >
                          {call.company_name || 'Prospect Company'}
                        </Link>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md ${getOutcomeBadge(call.call_outcome)}`}>
                          {call.call_outcome}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>Contact: {call.contact_name || 'Prospect Lead'}</span>
                        <span>•</span>
                        <span>{new Date(call.call_date).toLocaleDateString()} at {new Date(call.call_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleEditClick(call)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Update outcome or follow-up date"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCall(call.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {call.notes ? (
                    <div className="text-xs text-slate-200 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed font-mono whitespace-pre-wrap">
                      {call.notes}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">No notes recorded during this session.</div>
                  )}

                  {/* Follow-up Pill */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-2">
                      {call.follow_up_date ? (
                        <span className={`flex items-center gap-1.5 ${call.is_overdue ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Follow-up: {new Date(call.follow_up_date).toLocaleDateString()}</span>
                          {call.is_overdue && (
                            <span className="px-1.5 py-0.2 text-[10px] bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                              OVERDUE
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No follow-up date scheduled</span>
                      )}
                    </div>

                    <Link
                      href={`/workspace?companyId=${call.company_id}`}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                    >
                      <span>Call Again</span>
                      <PhoneCall className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHEDULED FOLLOW-UPS */}
      {activeTab === 'followups' && (
        <div className="space-y-6">
          {/* Overdue Section */}
          {followUps && followUps.overdue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Overdue Follow-ups ({followUps.overdue.length})
                </h2>
              </div>

              <div className="space-y-3">
                {followUps.overdue.map((call) => (
                  <div
                    key={call.id}
                    className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">
                          {call.company_name || 'Prospect'}
                        </span>
                        <span className="text-xs text-slate-400">• Contact: {call.contact_name}</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">
                          Due: {call.follow_up_date ? new Date(call.follow_up_date).toLocaleDateString() : 'Immediate'}
                        </span>
                      </div>
                      {call.notes && (
                        <p className="text-xs text-slate-300 italic line-clamp-1">
                          "{call.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditClick(call)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
                      >
                        Reschedule
                      </button>
                      <Link
                        href={`/workspace?companyId=${call.company_id}`}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Now</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Calendar className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Upcoming Follow-ups ({followUps?.upcoming.length || 0})
              </h2>
            </div>

            {(!followUps || followUps.upcoming.length === 0) ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
                No upcoming follow-ups scheduled. Log call outcomes as 'Interested' or 'Follow-up Required' with dates to see them here.
              </div>
            ) : (
              <div className="space-y-3">
                {followUps.upcoming.map((call) => (
                  <div
                    key={call.id}
                    className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">
                          {call.company_name || 'Prospect'}
                        </span>
                        <span className="text-xs text-slate-400">• Contact: {call.contact_name}</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                          Scheduled: {call.follow_up_date ? new Date(call.follow_up_date).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                      {call.notes && (
                        <p className="text-xs text-slate-300 italic line-clamp-1">
                          "{call.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditClick(call)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
                      >
                        Edit Date
                      </button>
                      <Link
                        href={`/workspace?companyId=${call.company_id}`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Open Workspace</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Call Outcome & Date Modal */}
      {editingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">
              Update Call Record ({editingCall.company_name})
            </h3>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Call Outcome
                </label>
                <select
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value as CallOutcome)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="Interested">Interested</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="No Answer">No Answer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={newFollowUpDate}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={4}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCall(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CallsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 text-sm">Loading Call History...</div>}>
      <CallsContent />
    </Suspense>
  );
}
