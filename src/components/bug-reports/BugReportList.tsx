// src/components/bug-reports/BugReportList.tsx
// Dashboard for viewing and managing bug reports

import { CheckCircle, ClipboardCopy, Clock, Filter, Loader, Search, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import BugReportService, { type BugPriority, type BugReport, type BugReportFilters, type BugStatus } from '../../lib/bugReportService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface BugReportListProps {
  onEditBug?: (bug: BugReport) => void;
  refreshTrigger?: number;
}

export const BugReportList: React.FC<BugReportListProps> = ({
  onEditBug,
  refreshTrigger
}) => {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [filteredBugs, setFilteredBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<BugStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<BugPriority[]>([]);
  const [pageFilter, setPageFilter] = useState<string[]>([]);
  
  // UI
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [availablePages, setAvailablePages] = useState<string[]>([]);
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    in_progress: 0,
    fixed: 0,
    verified: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  // Load bugs
  useEffect(() => {
    loadBugs();
    loadPageFeatures();
    loadStatistics();
  }, [refreshTrigger]);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [bugs, searchQuery, statusFilter, priorityFilter, pageFilter]);

  const loadBugs = async () => {
    setLoading(true);
    try {
      const filters: BugReportFilters = {};
      
      if (statusFilter.length > 0) {
        filters.status = statusFilter;
      }
      
      if (priorityFilter.length > 0) {
        filters.priority = priorityFilter;
      }
      
      if (pageFilter.length > 0) {
        filters.page_feature = pageFilter;
      }
      
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const data = await BugReportService.getBugReports(filters);
      setBugs(data);
    } catch (error) {
      console.error('Error loading bugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPageFeatures = async () => {
    const features = await BugReportService.getPageFeatures();
    setAvailablePages(features);
  };

  const loadStatistics = async () => {
    const statistics = await BugReportService.getBugStatistics();
    setStats(statistics);
  };

  const applyFilters = () => {
    let filtered = [...bugs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bug =>
        bug.title.toLowerCase().includes(query) ||
        bug.current_behavior.toLowerCase().includes(query) ||
        bug.expected_behavior.toLowerCase().includes(query)
      );
    }

    setFilteredBugs(filtered);
  };

  const handleStatusChange = async (bugId: string, newStatus: BugStatus, userId: string) => {
    setUpdating(bugId);
    try {
      const updated = await BugReportService.updateBugReport(
        bugId,
        { status: newStatus },
        userId
      );

      if (updated) {
        setBugs(prev => prev.map(b => b.id === bugId ? updated : b));
        await loadStatistics(); // Refresh stats
      }
    } catch (error) {
      console.error('Error updating bug status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleCopyToClaude = (bug: BugReport) => {
    const formatted = BugReportService.formatForClaude(bug);
    navigator.clipboard.writeText(formatted);
    setCopiedId(bug.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleStatusFilter = (status: BugStatus) => {
    setStatusFilter(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const togglePriorityFilter = (priority: BugPriority) => {
    setPriorityFilter(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const togglePageFilter = (page: string) => {
    setPageFilter(prev =>
      prev.includes(page)
        ? prev.filter(p => p !== page)
        : [...prev, page]
    );
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setPriorityFilter([]);
    setPageFilter([]);
    setSearchQuery('');
  };

  const getPriorityBadge = (priority: BugPriority) => {
    const config = {
      critical: { emoji: '🔴', label: 'Critical', variant: 'error' as const },
      high: { emoji: '🟠', label: 'High', variant: 'warning' as const },
      medium: { emoji: '🟡', label: 'Medium', variant: 'info' as const },
      low: { emoji: '🟢', label: 'Low', variant: 'success' as const }
    };
    const { emoji, label, variant } = config[priority];
    return (
      <Badge variant={variant} size="sm">
        {emoji} {label}
      </Badge>
    );
  };

  const getStatusBadge = (status: BugStatus) => {
    const config = {
      new: { icon: Clock, label: 'New', variant: 'info' as const },
      in_progress: { icon: Loader, label: 'In Progress', variant: 'warning' as const },
      fixed: { icon: CheckCircle, label: 'Fixed', variant: 'success' as const },
      verified: { icon: CheckCircle, label: 'Verified', variant: 'success' as const },
      wont_fix: { icon: XCircle, label: "Won't Fix", variant: 'error' as const }
    };
    const { icon: Icon, label, variant } = config[status];
    return (
      <Badge variant={variant} size="sm">
        <Icon size={12} className="mr-1" />
        {label}
      </Badge>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Ensure we're comparing UTC times
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Handle negative values (future dates - shouldn't happen but just in case)
    if (diffMs < 0) {
      return 'just now';
    }

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getReporterName = (bug: BugReport) => {
    if (bug.reporter) {
      const name = `${bug.reporter.first_name || ''} ${bug.reporter.last_name || ''}`.trim();
      return name || bug.reporter.email || 'Unknown';
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card hover={false} className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Bugs</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        </Card>
        <Card hover={false} className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">New</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.new}</div>
        </Card>
        <Card hover={false} className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.in_progress}</div>
        </Card>
        <Card hover={false} className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Fixed</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.fixed}</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card hover={false} className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bugs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter Button */}
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className="mr-2" />
            Filters
            {(statusFilter.length > 0 || priorityFilter.length > 0 || pageFilter.length > 0) && (
              <span className="ml-2 px-2 py-0.5 bg-white dark:bg-gray-800 rounded-full text-xs">
                {statusFilter.length + priorityFilter.length + pageFilter.length}
              </span>
            )}
          </Button>

          {/* Refresh Button */}
          <Button variant="ghost" size="md" onClick={() => loadBugs()}>
            <Loader size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* Status Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(['new', 'in_progress', 'fixed', 'verified', 'wont_fix'] as BugStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter.includes(status)
                        ? 'bg-[#f45a4e] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <div className="flex flex-wrap gap-2">
                {(['critical', 'high', 'medium', 'low'] as BugPriority[]).map(priority => (
                  <button
                    key={priority}
                    onClick={() => togglePriorityFilter(priority)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      priorityFilter.includes(priority)
                        ? 'bg-[#f45a4e] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Filters */}
            {availablePages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page/Feature
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePages.map(page => (
                    <button
                      key={page}
                      onClick={() => togglePageFilter(page)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        pageFilter.includes(page)
                          ? 'bg-[#f45a4e] text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(statusFilter.length > 0 || priorityFilter.length > 0 || pageFilter.length > 0) && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Bug List */}
      <div className="space-y-4">
        {filteredBugs.length === 0 ? (
          <Card hover={false} className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || statusFilter.length > 0 || priorityFilter.length > 0 || pageFilter.length > 0
                ? 'No bugs match your filters'
                : 'No bugs reported yet'}
            </p>
          </Card>
        ) : (
          filteredBugs.map(bug => (
            <Card key={bug.id} hover={true} className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Main Content */}
                <div className="flex-1 space-y-3">
                  {/* Title and Badges */}
                  <div className="flex items-start gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                      {bug.title}
                    </h3>
                    {getPriorityBadge(bug.priority)}
                    {getStatusBadge(bug.status)}
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{bug.page_feature}</span>
                    <span>•</span>
                    <span>Reported by {getReporterName(bug)}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(bug.reported_at)}</span>
                  </div>

                  {/* Behavior Summary */}
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p className="line-clamp-2">{bug.current_behavior}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2">
                  {/* Status Dropdown */}
                  <select
                    value={bug.status}
                    onChange={(e) => handleStatusChange(bug.id, e.target.value as BugStatus, bug.reported_by)}
                    disabled={updating === bug.id}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="fixed">Fixed</option>
                    <option value="verified">Verified</option>
                    <option value="wont_fix">Won't Fix</option>
                  </select>

                  {/* Copy to Claude Button */}
                  <Button
                    variant={copiedId === bug.id ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => handleCopyToClaude(bug)}
                  >
                    {copiedId === bug.id ? (
                      <>
                        <CheckCircle size={14} className="mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardCopy size={14} className="mr-1" />
                        Copy Report
                      </>
                    )}
                  </Button>

                  {/* View/Edit Button */}
                  {onEditBug && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditBug(bug)}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BugReportList;