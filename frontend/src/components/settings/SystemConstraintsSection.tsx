import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  RotateCw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Search,
  Users,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import {
  getConstraintsApi,
  createConstraintApi,
  updateConstraintApi,
  deleteConstraintApi,
  toggleConstraintApi,
  resetConstraintsApi
} from '../../api/client';
import { SystemConstraint } from '../../types';

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  LEAD_ROTATION: { label: 'Lead Rotation', color: 'bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400' },
  SUNDAY_SQUAD: { label: 'Sunday Squad', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 dark:text-indigo-400' },
  EARLY_MORNING: { label: 'Early Morning (08:00)', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400' },
  DAYS_OFF: { label: 'Days Off Policy', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400' },
  TASK_ROTATION: { label: 'Task Assignment', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400' },
  GENERAL: { label: 'General / Custom', color: 'bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-400' },
};

export const SystemConstraintsSection: React.FC = () => {
  const [constraints, setConstraints] = useState<SystemConstraint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('GENERAL');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formStaffNames, setFormStaffNames] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchConstraints = async () => {
    setIsLoading(true);
    try {
      const data = await getConstraintsApi(false);
      setConstraints(data);
    } catch (err) {
      console.error('Failed to fetch constraints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConstraints();
  }, []);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('GENERAL');
    setFormDescription('');
    setFormStaffNames('');
    setFormIsActive(true);
    setIsEditing(true);
  };

  const openEditForm = (c: SystemConstraint) => {
    setEditingId(c.id);
    setFormTitle(c.title);
    setFormCategory(c.category || 'GENERAL');
    setFormDescription(c.description);
    setFormStaffNames(c.staff_names || '');
    setFormIsActive(c.is_active);
    setIsEditing(true);
  };

  const cancelForm = () => {
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSaveConstraint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Please enter title and description for this constraint.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await updateConstraintApi(editingId, {
          title: formTitle.trim(),
          category: formCategory,
          description: formDescription.trim(),
          staff_names: formStaffNames.trim(),
          is_active: formIsActive
        });
        notify(`Constraint "${formTitle}" updated successfully`);
      } else {
        await createConstraintApi({
          title: formTitle.trim(),
          category: formCategory,
          description: formDescription.trim(),
          staff_names: formStaffNames.trim(),
          is_active: formIsActive
        });
        notify(`Constraint "${formTitle}" added successfully`);
      }
      setIsEditing(false);
      setEditingId(null);
      await fetchConstraints();
    } catch (err: any) {
      alert(err.message || 'Failed to save constraint');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (c: SystemConstraint) => {
    try {
      await toggleConstraintApi(c.id);
      setConstraints(prev =>
        prev.map(item => item.id === c.id ? { ...item, is_active: !item.is_active } : item)
      );
      notify(`"${c.title}" is now ${!c.is_active ? 'active' : 'paused'}`);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle constraint');
    }
  };

  const handleDelete = async (c: SystemConstraint) => {
    if (!confirm(`Delete constraint "${c.title}"?`)) return;
    try {
      await deleteConstraintApi(c.id);
      setConstraints(prev => prev.filter(item => item.id !== c.id));
      notify(`Deleted constraint "${c.title}"`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete constraint');
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Reset all constraints to the factory default 9 system constraints?')) return;
    setIsLoading(true);
    try {
      const data = await resetConstraintsApi();
      setConstraints(data);
      notify('Factory default system constraints restored');
    } catch (err: any) {
      alert(err.message || 'Failed to reset constraints');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = constraints.filter(c => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      (c.staff_names && c.staff_names.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header card with action buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            Operational Constraints &amp; Fixed Rules
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {constraints.filter(c => c.is_active).length} Active of {constraints.length}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure rules enforced during schedule generation and validation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing && (
            <>
              <button
                type="button"
                onClick={openAddForm}
                className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-xs flex items-center space-x-1.5 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Constraint</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="h-8 px-2.5 rounded-lg border border-border bg-secondary hover:bg-accent text-secondary-foreground text-xs font-medium flex items-center space-x-1.5 transition"
                title="Restore default 9 rules"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden md:inline">Reset Defaults</span>
              </button>
            </>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Form when adding or editing */}
      {isEditing && (
        <form onSubmit={handleSaveConstraint} className="p-5 rounded-xl border border-primary/30 bg-primary/[0.02] space-y-4 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              {editingId ? `Edit Constraint: ${formTitle}` : 'Create New Operational Constraint'}
            </h4>
            <span className="text-xs text-muted-foreground">
              {editingId ? `ID #${editingId}` : 'New Rule'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Constraint Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Early Morning (08:00), Sunday Squad, Lead Rotation"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Category Classification
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="LEAD_ROTATION">Lead Rotation</option>
                <option value="SUNDAY_SQUAD">Sunday Squad</option>
                <option value="EARLY_MORNING">Early Morning (08:00)</option>
                <option value="DAYS_OFF">Days Off Policy</option>
                <option value="TASK_ROTATION">Task Assignment</option>
                <option value="GENERAL">General / Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Constraint Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="Detailed description of rule enforced (e.g. Exactly 5 staff on duty; 2-3 get Monday recovery OFF)."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full p-3 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Assigned Staff Members
              </label>
              <input
                type="text"
                placeholder="Comma-separated employee names (e.g. Hebron, Shalom, Rediet, Tirsit)"
                value={formStaffNames}
                onChange={(e) => setFormStaffNames(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pt-4 flex items-center space-x-2">
              <input
                type="checkbox"
                id="secActiveCheck"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-primary border-input focus:ring-primary"
              />
              <label htmlFor="secActiveCheck" className="text-xs font-medium text-foreground cursor-pointer">
                Enforce Active in Engine
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={cancelForm}
              className="h-8 px-3.5 rounded-lg border border-border bg-secondary hover:bg-accent text-secondary-foreground text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Constraint'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      {!isEditing && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`h-7 px-2.5 rounded-md text-[11px] font-semibold transition shrink-0 ${
                  selectedCategory === 'ALL'
                    ? 'bg-foreground text-background shadow-xs'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({constraints.length})
              </button>
              {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
                const count = constraints.filter(c => c.category === catKey).length;
                if (count === 0 && selectedCategory !== catKey) return null;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setSelectedCategory(catKey)}
                    className={`h-7 px-2.5 rounded-md text-[11px] font-semibold transition shrink-0 ${
                      selectedCategory === catKey
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {catInfo.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search rule or staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Constraints Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <RotateCw className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-border text-muted-foreground text-xs">
              No constraints found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filtered.map((c) => {
                const cat = CATEGORY_LABELS[c.category] || CATEGORY_LABELS.GENERAL;
                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      c.is_active
                        ? 'border-border bg-card shadow-xs hover:border-primary/40'
                        : 'border-border/60 bg-muted/20 opacity-75'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{c.title}</span>

                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cat.color}`}>
                          {cat.label}
                        </span>

                        {c.is_active ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground">
                            PAUSED
                          </span>
                        )}

                        {c.is_system && (
                          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                            Core Rule
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {c.description}
                      </p>

                      {c.staff_names && (
                        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                          <Users className="w-3 h-3 text-primary shrink-0" />
                          <span className="font-medium text-foreground">Assigned:</span>
                          <span>{c.staff_names}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(c)}
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition flex items-center space-x-1.5 ${
                          c.is_active
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                        }`}
                        title={c.is_active ? 'Disable constraint' : 'Activate constraint'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                        <span>{c.is_active ? 'Active' : 'Off'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditForm(c)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
                        title="Edit rule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
