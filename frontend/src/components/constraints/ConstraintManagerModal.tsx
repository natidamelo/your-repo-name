import React, { useState, useEffect } from 'react';
import {
  X,
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
  Tag,
  CheckCircle2,
  Sliders
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

interface ConstraintManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConstraintsChanged?: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  LEAD_ROTATION: { label: 'Lead Rotation', color: 'bg-sky-500/10 text-sky-600 border-sky-500/30 dark:text-sky-400' },
  SUNDAY_SQUAD: { label: 'Sunday Squad', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 dark:text-indigo-400' },
  EARLY_MORNING: { label: 'Early Morning (08:00)', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400' },
  DAYS_OFF: { label: 'Days Off Policy', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400' },
  TASK_ROTATION: { label: 'Task Assignment', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400' },
  GENERAL: { label: 'General / Custom', color: 'bg-slate-500/10 text-slate-600 border-slate-500/30 dark:text-slate-400' },
};

export const ConstraintManagerModal: React.FC<ConstraintManagerModalProps> = ({
  isOpen,
  onClose,
  onConstraintsChanged
}) => {
  const [constraints, setConstraints] = useState<SystemConstraint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form State for Add / Edit
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('GENERAL');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formStaffNames, setFormStaffNames] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
    if (isOpen) {
      fetchConstraints();
      setIsEditing(false);
      setEditingId(null);
      setActionSuccess(null);
    }
  }, [isOpen]);

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
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
      alert('Please provide both Title and Description for the constraint.');
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
        showSuccess('Constraint updated successfully');
      } else {
        await createConstraintApi({
          title: formTitle.trim(),
          category: formCategory,
          description: formDescription.trim(),
          staff_names: formStaffNames.trim(),
          is_active: formIsActive
        });
        showSuccess('New constraint added successfully');
      }
      setIsEditing(false);
      setEditingId(null);
      await fetchConstraints();
      onConstraintsChanged?.();
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
      showSuccess(`"${c.title}" is now ${!c.is_active ? 'active' : 'disabled'}`);
      onConstraintsChanged?.();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle constraint');
    }
  };

  const handleDelete = async (c: SystemConstraint) => {
    if (!confirm(`Are you sure you want to delete constraint "${c.title}"?`)) return;
    try {
      await deleteConstraintApi(c.id);
      setConstraints(prev => prev.filter(item => item.id !== c.id));
      showSuccess(`Constraint "${c.title}" removed`);
      onConstraintsChanged?.();
    } catch (err: any) {
      alert(err.message || 'Failed to delete constraint');
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Reset all constraints to the default 9 system constraints? Custom rules will be replaced with defaults.')) return;
    setIsLoading(true);
    try {
      const data = await resetConstraintsApi();
      setConstraints(data);
      showSuccess('Factory default system constraints restored');
      onConstraintsChanged?.();
    } catch (err: any) {
      alert(err.message || 'Failed to reset constraints');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredConstraints = constraints.filter(c => {
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.title.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      (c.staff_names && c.staff_names.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col my-auto overflow-hidden text-foreground"
        style={{ maxHeight: 'min(92vh, calc(100vh - 32px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                Operational Constraints &amp; Fixed Rules
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {constraints.filter(c => c.is_active).length} Active
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add, edit, enable/disable, and configure rules enforced by the scheduling engine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action success banner */}
        {actionSuccess && (
          <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Top Controls: Add Button & Reset */}
          {!isEditing && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={openAddForm}
                  className="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-sm flex items-center space-x-1.5 transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Fixed Constraint</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="h-9 px-3 rounded-lg border border-border bg-secondary hover:bg-accent text-secondary-foreground text-xs font-medium flex items-center space-x-1.5 transition"
                  title="Restore 9 default system rules"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Reset Defaults</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search constraints or staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Category Filter Pills */}
          {!isEditing && (
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
                All Rules ({constraints.length})
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
          )}

          {/* Add / Edit Form Mode */}
          {isEditing && (
            <form onSubmit={handleSaveConstraint} className="p-5 rounded-xl border border-primary/30 bg-primary/[0.02] space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  {editingId ? 'Edit Fixed Constraint' : 'Create New Fixed Constraint'}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {editingId ? `Rule ID #${editingId}` : 'New Rule'}
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
                    placeholder="e.g. Hebron & Beti, Sunday Squad, Friday Off"
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
                  Enforced Rule Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain the constraint logic (e.g. Exactly 5 staff on duty; 2-3 get Monday recovery OFF)."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-3 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Target Staff Members
                  </label>
                  <input
                    type="text"
                    placeholder="Comma-separated names (e.g. Shalom, Rediet, Tirsit)"
                    value={formStaffNames}
                    onChange={(e) => setFormStaffNames(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="pt-4 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-input focus:ring-primary"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-medium text-foreground cursor-pointer">
                    Enforce Active
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="h-9 px-4 rounded-lg border border-border bg-secondary hover:bg-accent text-secondary-foreground text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Constraint'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Constraint List */}
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[220px]">
              <RotateCw className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : filteredConstraints.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-border text-muted-foreground text-xs space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-muted-foreground/60" />
              <p>No constraints match your filter.</p>
              <button
                type="button"
                onClick={openAddForm}
                className="text-primary hover:underline font-semibold"
              >
                + Add a new constraint now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredConstraints.map((c) => {
                const cat = CATEGORY_LABELS[c.category] || CATEGORY_LABELS.GENERAL;
                return (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      c.is_active
                        ? 'border-border bg-card hover:border-primary/40 shadow-xs'
                        : 'border-border/60 bg-muted/30 opacity-70'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
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
                            System Core
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {c.description}
                      </p>

                      {c.staff_names && (
                        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                          <Users className="w-3 h-3 text-primary shrink-0" />
                          <span className="font-medium text-foreground">Staff:</span>
                          <span className="truncate">{c.staff_names}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions: Toggle, Edit, Delete */}
                    <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                      {/* Active Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggle(c)}
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition flex items-center space-x-1 ${
                          c.is_active
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                        }`}
                        title={c.is_active ? 'Click to disable' : 'Click to activate'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                        <span>{c.is_active ? 'Active' : 'Off'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditForm(c)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
                        title="Edit Constraint"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete Constraint"
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

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground">
          <span>{constraints.length} total constraints configured</span>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
