import React, { useState } from 'react';
import { TrendingUp, Target, MapPin, AlertTriangle, Calendar, Download, FileText, Search, Plus, ChevronLeft, ChevronRight, Play, Pause, Eye, Filter } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface RankingData {
  position: number | null;
  gridPosition: number;
  competitor?: string;
}

interface KeywordData {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  averageRanking: number;
  visibility: number;
  trend: number;
  previousMonth: RankingData[];
  currentMonth: RankingData[];
  improvements: number[];
}

const mockKeywords: KeywordData[] = [
  {
    id: '1',
    keyword: 'acne treatment',
    searchVolume: 2400,
    difficulty: 65,
    averageRanking: 3.2,
    visibility: 78,
    trend: 12,
    previousMonth: Array.from({ length: 144 }, (_, i) => ({
      position: Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 1 : null,
      gridPosition: i + 1
    })),
    currentMonth: Array.from({ length: 144 }, (_, i) => ({
      position: Math.random() > 0.6 ? Math.floor(Math.random() * 15) + 1 : null,
      gridPosition: i + 1
    })),
    improvements: [23, 45, 67, 89, 112, 134]
  },
  {
    id: '2',
    keyword: 'dermatologist near me',
    searchVolume: 1800,
    difficulty: 72,
    averageRanking: 2.8,
    visibility: 85,
    trend: 8,
    previousMonth: Array.from({ length: 144 }, (_, i) => ({
      position: Math.random() > 0.6 ? Math.floor(Math.random() * 18) + 1 : null,
      gridPosition: i + 1
    })),
    currentMonth: Array.from({ length: 144 }, (_, i) => ({
      position: Math.random() > 0.5 ? Math.floor(Math.random() * 12) + 1 : null,
      gridPosition: i + 1
    })),
    improvements: [12, 34, 56, 78, 90, 123]
  },
  {
    id: '3',
    keyword: 'skin care clinic',
    searchVolume: 1200,
    difficulty: 58,
    averageRanking: 4.1,
    visibility: 65,
    trend: -3,
    previousMonth: Array.from({ length: 144 }, (_, i) => ({
      position: Math.random() > 0.8 ? Math.floor(Math.random() * 25) + 1 : null,
      gridPosition: i + 1
    })),
    currentMonth: Array.from({ length: 144 }, (_, i) => ({
      position: Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 1 : null,
      gridPosition: i + 1
    })),
    improvements: [45, 67, 89]
  }
];

export const Rankings: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [gridSize, setGridSize] = useState(12);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getPositionColor = (position: number | null) => {
    if (!position) return 'bg-gray-800 text-gray-400';
    if (position <= 3) return 'bg-green-600 text-white';
    if (position <= 7) return 'bg-amber-500 text-black';
    if (position <= 12) return 'bg-orange-500 text-white';
    if (position <= 20) return 'bg-red-500 text-white';
    return 'bg-red-700 text-white';
  };

  const getPositionText = (position: number | null) => {
    if (!position) return '20+';
    if (position > 20) return '20+';
    return position.toString();
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
    trend?: number;
  }> = ({ title, value, icon: Icon, gradient, trend }) => (
    <Card hover>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={14} className={trend < 0 ? 'rotate-180' : ''} />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${gradient}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );

  const RankingGrid: React.FC<{
    data: RankingData[];
    title: string;
    date: string;
    improvements?: number[];
  }> = ({ data, title, date, improvements = [] }) => {
    const gridCols = gridSize === 8 ? 'grid-cols-8' : gridSize === 10 ? 'grid-cols-10' : 'grid-cols-12';
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{date}</p>
          <div className="flex justify-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span className="text-gray-600 dark:text-gray-400">
              Avg: {(data.filter(d => d.position).reduce((sum, d) => sum + (d.position || 0), 0) / data.filter(d => d.position).length || 0).toFixed(1)}
            </span>
            <span className="text-green-600">
              Top 3: {data.filter(d => d.position && d.position <= 3).length}
            </span>
          </div>
        </div>
        
        {/* Map Container with Overlay Grid */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden">
          {/* Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-25 to-green-50 dark:from-green-900/10 dark:via-blue-900/10 dark:to-green-900/10">
            {/* Simulated Map Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              {/* Street Grid Pattern */}
              <svg className="w-full h-full" viewBox="0 0 400 400">
                {/* Horizontal Streets */}
                {Array.from({ length: 8 }, (_, i) => (
                  <line
                    key={`h-${i}`}
                    x1="0"
                    y1={50 + i * 40}
                    x2="400"
                    y2={50 + i * 40}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                ))}
                {/* Vertical Streets */}
                {Array.from({ length: 8 }, (_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={50 + i * 40}
                    y1="0"
                    x2={50 + i * 40}
                    y2="400"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                ))}
              </svg>
            </div>
          </div>
          
          {/* Ranking Grid Overlay */}
          <div className={`absolute inset-0 grid ${gridCols} gap-2 p-6`}>
            {data.slice(0, gridSize * gridSize).map((item, index) => (
              <div
                key={index}
                className={`
                  w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center 
                  text-[8px] sm:text-[10px] md:text-xs font-bold transition-all duration-300 hover:scale-125 cursor-pointer 
                  shadow-lg border-2 border-white relative z-10
                  ${getPositionColor(item.position)}
                  ${improvements.includes(index) ? 'ring-2 ring-green-400 ring-offset-1' : ''}
                `}
                title={`Grid ${item.gridPosition}: ${item.position ? `Position ${item.position}` : 'Not ranking'} for "${mockKeywords.find(k => k.currentMonth === data)?.keyword || 'keyword'}"`}
              >
                {getPositionText(item.position)}
                {improvements.includes(index) && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full flex items-center justify-center border border-white">
                    <TrendingUp size={6} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Map Legend */}
          <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded px-2 py-1 text-xs z-20">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">1-3</span>
              <div className="w-3 h-3 bg-amber-500 rounded-full ml-2"></div>
              <span className="text-gray-700 dark:text-gray-300">4-7</span>
              <div className="w-3 h-3 bg-orange-500 rounded-full ml-2"></div>
              <span className="text-gray-700 dark:text-gray-300">8-12</span>
              <div className="w-3 h-3 bg-red-500 rounded-full ml-2"></div>
              <span className="text-gray-700 dark:text-gray-300">13+</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const KeywordSection: React.FC<{ keyword: KeywordData }> = ({ keyword }) => (
    <Card className="mb-8">
      {/* Keyword Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              "{keyword.keyword}"
            </h3>
            <Badge variant={keyword.trend >= 0 ? 'success' : 'error'} size="sm">
              {keyword.trend >= 0 ? '+' : ''}{keyword.trend}%
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Volume: {keyword.searchVolume.toLocaleString()}/mo</span>
            <span>Difficulty: {keyword.difficulty}/100</span>
            <span>Visibility: {keyword.visibility}%</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Eye size={16} />
            Details
          </Button>
          <Button variant="ghost" size="sm">
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>

      {/* Side-by-Side Grids */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12">
        <div className="flex-1 min-w-[350px]">
          <RankingGrid
            data={keyword.previousMonth}
            title="Previous Month"
            date="Jul 17, 2025"
          />
        </div>
        
        {/* Improvement Arrow Between Maps */}
        <div className="flex items-center justify-center lg:mt-20 flex-shrink-0">
          <div className="flex flex-col lg:flex-row items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <ChevronRight size={16} className="text-white lg:block hidden" />
              <TrendingUp size={16} className="text-white lg:hidden" />
            </div>
            <span className="text-sm font-medium text-green-600">
              {keyword.improvements.length} improvements
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-[350px]">
          <RankingGrid
            data={keyword.currentMonth}
            title="Current Month"
            date="Sep 16, 2025"
            improvements={keyword.improvements}
          />
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{keyword.improvements.length}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Improvements</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{keyword.averageRanking}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Avg Position</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{keyword.visibility}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Visibility</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            {keyword.currentMonth.filter(d => d.position && d.position <= 3).length}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Top 3 Spots</p>
        </div>
      </div>
    </Card>
  );

  const NewCustomerExperience: React.FC = () => (
    <Card className="text-center py-16">
      <div className="max-w-2xl mx-auto">
        <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-6">
          <Target size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your Initial Ranking Snapshot
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          We've captured your starting positions across all local search areas. Next month, you'll see side-by-side comparisons showing your improvements!
        </p>
        
        {/* Sample Initial Grid */}
        <div className="flex justify-center mb-8">
          <RankingGrid
            data={mockKeywords[0].currentMonth}
            title="Baseline Rankings"
            date="Sep 16, 2025"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Badge variant="gradient" className="px-4 py-2">Your Starting Position</Badge>
          <Badge variant="info" className="px-4 py-2">Next Audit in 23 Days</Badge>
        </div>

        {/* Progress Bar */}
        <div className="max-w-sm mx-auto">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress to Next Audit</span>
            <span>23%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e] h-2 rounded-full" style={{ width: '23%' }}></div>
          </div>
        </div>
      </div>
    </Card>
  );

  const filteredKeywords = mockKeywords.filter(keyword =>
    keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const overallStats = {
    totalKeywords: mockKeywords.length,
    averagePosition: (mockKeywords.reduce((sum, k) => sum + k.averageRanking, 0) / mockKeywords.length).toFixed(1),
    totalImprovements: mockKeywords.reduce((sum, k) => sum + k.improvements.length, 0),
    averageVisibility: Math.round(mockKeywords.reduce((sum, k) => sum + k.visibility, 0) / mockKeywords.length)
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Local Search Rankings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Downtown Dermatology Clinic - Comprehensive ranking analysis
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Tracking Active
            </span>
          </div>
          <Button variant="secondary" icon={FileText}>
            Generate Report
          </Button>
          <Button icon={Download}>
            Export All
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-64 pl-10 pr-4 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
              />
            </div>
            
            <Button variant="secondary" size="sm" icon={Plus}>
              Add Keyword
            </Button>
            
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="px-3 py-2 bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f45a4e] focus:border-transparent"
            >
              <option value={8}>8x8 Grid</option>
              <option value={10}>10x10 Grid</option>
              <option value={12}>12x12 Grid</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAnimating(!isAnimating)}
              icon={isAnimating ? Pause : Play}
            >
              {isAnimating ? 'Pause' : 'Animate'}
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant={selectedMonth === 'previous' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMonth('previous')}
              >
                Previous
              </Button>
              <Button
                variant={selectedMonth === 'current' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedMonth('current')}
              >
                Current
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Keywords Tracked"
          value={overallStats.totalKeywords}
          icon={Target}
          gradient="bg-gradient-to-r from-[#667eea] to-[#764ba2]"
        />
        <StatCard
          title="Average Position"
          value={overallStats.averagePosition}
          icon={TrendingUp}
          gradient="bg-gradient-to-r from-[#11998e] to-[#38ef7d]"
          trend={8}
        />
        <StatCard
          title="Total Improvements"
          value={overallStats.totalImprovements}
          icon={MapPin}
          gradient="bg-gradient-to-r from-[#f093fb] to-[#f5576c]"
          trend={15}
        />
        <StatCard
          title="Average Visibility"
          value={`${overallStats.averageVisibility}%`}
          icon={Eye}
          gradient="bg-gradient-to-r from-[#f45a4e] to-[#e53e3e]"
          trend={12}
        />
      </div>

      {/* Monthly Timeline */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Progression</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <ChevronLeft size={16} />
            </Button>
            <div className="flex gap-2">
              {['May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month, index) => (
                <div
                  key={month}
                  className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${
                    index === 4 ? 'bg-[#f45a4e]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  title={`${month} 2025`}
                />
              ))}
            </div>
            <Button variant="ghost" size="sm">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
        
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#f45a4e] to-[#11998e] rounded-full transition-all duration-1000" style={{ width: '80%' }}></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
          <span>May 2025</span>
          <span>Sep 2025 (Current)</span>
        </div>
      </Card>

      {/* Keyword Sections */}
      {filteredKeywords.length === 0 ? (
        <Card className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="inline-flex p-6 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full mb-6">
              <Search size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Keywords Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              No keywords match your search criteria. Try adjusting your search terms.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredKeywords.map((keyword) => (
            <KeywordSection key={keyword.id} keyword={keyword} />
          ))}
        </div>
      )}

      {/* New Customer Experience (shown when no historical data) */}
      {/* Uncomment this section for new customers */}
      {/* <NewCustomerExperience /> */}
    </div>
  );
};