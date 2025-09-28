import { Bell, Building, Calendar, CheckCircle2, ExternalLink, Info, Key, Mail, MapPin, Search, Star, UploadCloud, Users, Youtube } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

// Mock data - replace with real data from your database
const MOCK_READY_BUSINESSES = [
  {
    id: "1",
    businessName: "Sunny Side Café",
    email: "owner@sunnysidecafe.com",
    address: "123 Main St, Denver, CO 80202",
    googleConnected: true,
    onboardingComplete: false,
    connectedDate: "2025-09-25",
    organizationId: "org-1"
  },
  {
    id: "2", 
    businessName: "Tech Repair Hub",
    email: "info@techrepairhub.com",
    address: "456 Broadway, Boulder, CO 80301",
    googleConnected: true,
    onboardingComplete: false,
    connectedDate: "2025-09-24",
    organizationId: "org-2"
  },
  {
    id: "3",
    businessName: "Mountain View Dental",
    email: "contact@mvdental.com", 
    address: "789 Valley Dr, Aspen, CO 81611",
    googleConnected: true,
    onboardingComplete: false,
    connectedDate: "2025-09-23",
    organizationId: "org-3"
  }
];

const MOCK_SUGGESTED_KEYWORDS = ["Espresso", "Artisan Bakery", "Breakfast", "Pastry", "Organic Coffee", "Denver Coffee", "Gluten-free"];
const MOCK_SUGGESTED_SERVICES = ["Mobile Orders", "Catering", "Outdoor Seating", "WiFi", "Pet Friendly", "Group Events"];
const MOCK_REVIEWS = [
  { id: "1", author: "John D.", rating: 1, text: "Dirty restrooms... will not be back.", date: "2025-08-10" },
  { id: "2", author: "Sara B.", rating: 2, text: "Coffee was cold, staff seemed stressed.", date: "2025-09-01" },
  { id: "3", author: "Tom S.", rating: 1, text: "Waited 15 minutes for a bagel.", date: "2025-07-22" },
  { id: "4", author: "Fay K.", rating: 2, text: "Good pastries but my latte was poor.", date: "2025-07-19" },
  { id: "5", author: "Doug N.", rating: 2, text: "Unfriendly service.", date: "2025-08-13" }
];
const MOCK_SUGGESTED_FAQS = [
  { q: "Do you offer vegan pastries?", a: "Yes! We have vegan and gluten-free options daily." },
  { q: "Are dogs allowed?", a: "We welcome furry friends on the patio." },
  { q: "Do you offer WiFi?", a: "Free WiFi is available with purchase." }
];

const steps = [
  { id: "search", title: "Select Business", icon: <Search size={22} /> },
  { id: "logo", title: "Business Logo", icon: <UploadCloud size={22} /> },
  { id: "keywords", title: "Keywords & Services", icon: <Key size={22} /> },
  { id: "social", title: "Social Profiles", icon: <Youtube size={22} /> },
  { id: "reviews", title: "Review Management", icon: <Star size={22} /> },
  { id: "faq", title: "FAQs & Service Content", icon: <Info size={22} /> },
  { id: "media", title: "Upload Images", icon: <UploadCloud size={22} /> },
  { id: "notifications", title: "Notifications", icon: <Bell size={22} /> },
  { id: "team", title: "Team Members", icon: <Users size={22} /> },
  { id: "summary", title: "Review & Finish", icon: <CheckCircle2 size={22} /> }
];

type SelectedBusiness = {
  id: string;
  businessName: string;
  email: string;
  address: string;
  organizationId: string;
};

type OnboardingData = {
  selectedBusiness: SelectedBusiness | null;
  logo: File | null;
  keywords: string[];
  manualKeyword: string;
  services: string[];
  manualService: string;
  social: { youtube?: string; instagram?: string; facebook?: string; twitter?: string };
  flagReviews: string[];
  faq: {q: string; a: string}[];
  servicesDesc: Record<string, string>;
  media: File[];
  mediaPreview: string[];
  skippedMedia: boolean;
  notificationMethod: string[];
  notificationEmail: string;
  ccEmails: string[];
  notificationPhone: string;
  team: string[];
  manualTeam: string;
};

const AdminOnboarding: React.FC = () => {
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<typeof MOCK_READY_BUSINESSES>([]);
  const [readyBusinesses] = useState<typeof MOCK_READY_BUSINESSES>(MOCK_READY_BUSINESSES);
  const [data, setData] = useState<OnboardingData>({
    selectedBusiness: null,
    logo: null,
    keywords: [],
    manualKeyword: "",
    services: [],
    manualService: "",
    social: {},
    flagReviews: [],
    faq: [],
    servicesDesc: {},
    media: [],
    mediaPreview: [],
    skippedMedia: false,
    notificationMethod: [],
    notificationEmail: "",
    ccEmails: [],
    notificationPhone: "",
    team: [],
    manualTeam: ""
  });

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const filtered = MOCK_READY_BUSINESSES.filter(business =>
        business.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const selectBusiness = (business: typeof MOCK_READY_BUSINESSES[0]) => {
    setData(d => ({
      ...d,
      selectedBusiness: {
        id: business.id,
        businessName: business.businessName,
        email: business.email,
        address: business.address,
        organizationId: business.organizationId
      },
      notificationEmail: business.email
    }));
    setStepIdx(1);
  };

  const renderBusinessSearch = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Complete Customer Onboarding
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Search for businesses ready to complete their profile setup
        </p>
      </div>

      {/* Global Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Search by business name, email, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 text-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          style={{ '--tw-ring-color': '#f45a4e' } as React.CSSProperties}
        />
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search Results</h3>
          {searchResults.map((business) => (
            <div key={business.id} className="cursor-pointer" onClick={() => selectBusiness(business)}>
              <Card className="p-4 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Building className="text-blue-600 dark:text-blue-400" size={20} />
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{business.businessName}</h4>
                      <Badge variant="info" className="text-xs">Ready for Onboarding</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Mail size={16} />
                        {business.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        {business.address}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <CheckCircle2 size={14} className="text-green-500" />
                      Google connected on {business.connectedDate}
                    </div>
                  </div>
                  <ExternalLink className="text-gray-400 dark:text-gray-500" size={20} />
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Ready Businesses Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Businesses Ready for Onboarding
          </h3>
          <Badge variant="info" className="text-sm">
            {readyBusinesses.length} pending
          </Badge>
        </div>
        
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Business</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Connected</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {readyBusinesses.map((business) => (
                <tr key={business.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900 dark:text-white">{business.businessName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin size={12} />
                        {business.address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <Mail size={14} />
                      {business.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <div className="text-sm">
                        <div className="text-gray-900 dark:text-white font-medium">Google Business</div>
                        <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {business.connectedDate}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => selectBusiness(business)}
                      className="font-medium"
                    >
                      Start Onboarding
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderKeywordsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Keywords & Services
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          for {data.selectedBusiness?.businessName}
        </p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Select Relevant Keywords
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {MOCK_SUGGESTED_KEYWORDS.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => {
                  if (!data.keywords.includes(keyword)) {
                    setData(d => ({ ...d, keywords: [...d.keywords, keyword] }));
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  data.keywords.includes(keyword)
                    ? "text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                style={data.keywords.includes(keyword) ? { backgroundColor: '#f45a4e' } : {}}
              >
                {keyword}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={data.manualKeyword}
              onChange={(e) => setData(d => ({ ...d, manualKeyword: e.target.value }))}
              placeholder="Add custom keyword..."
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              style={{ '--tw-ring-color': '#f45a4e' } as React.CSSProperties}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                const keyword = data.manualKeyword.trim();
                if (keyword && !data.keywords.includes(keyword)) {
                  setData(d => ({
                    ...d,
                    keywords: [...d.keywords, keyword],
                    manualKeyword: ""
                  }));
                }
              }}
            >
              Add
            </Button>
          </div>
          
          {data.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {data.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-2 px-3 py-1 text-white rounded-full text-sm font-medium"
                  style={{ backgroundColor: '#f45a4e' }}
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => setData(d => ({ 
                      ...d, 
                      keywords: d.keywords.filter(k => k !== keyword) 
                    }))}
                    className="hover:opacity-80 rounded-full p-1 transition-opacity"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Select Services
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {MOCK_SUGGESTED_SERVICES.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => {
                  if (!data.services.includes(service)) {
                    setData(d => ({ ...d, services: [...d.services, service] }));
                  }
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  data.services.includes(service)
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-gray-600"
                }`}
              >
                {service}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={data.manualService}
              onChange={(e) => setData(d => ({ ...d, manualService: e.target.value }))}
              placeholder="Add custom service..."
              className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              style={{ '--tw-ring-color': '#f45a4e' } as React.CSSProperties}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                const service = data.manualService.trim();
                if (service && !data.services.includes(service)) {
                  setData(d => ({
                    ...d,
                    services: [...d.services, service],
                    manualService: ""
                  }));
                }
              }}
            >
              Add
            </Button>
          </div>
          
          {data.services.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {data.services.map((service) => (
                <span
                  key={service}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium"
                >
                  {service}
                  <button
                    type="button"
                    onClick={() => setData(d => ({ 
                      ...d, 
                      services: d.services.filter(s => s !== service) 
                    }))}
                    className="hover:bg-green-700 rounded-full p-1 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep = (): React.ReactNode => {
    if (stepIdx === 0) return renderBusinessSearch();
    if (stepIdx === 2) return renderKeywordsStep();
    
    const inputClasses = "px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400";
    const inputStyle = { '--tw-ring-color': '#f45a4e' } as React.CSSProperties;
    
    switch (stepIdx) {
      case 1: // Business Logo
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Business Logo
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Upload a logo for {data.selectedBusiness?.businessName}
              </p>
            </div>
            <div className="space-y-4">
              <style>
                {`
                  .file-input-orange::file-selector-button {
                    background-color: #f45a4e;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    margin-right: 16px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: opacity 0.2s;
                  }
                  .file-input-orange::file-selector-button:hover {
                    opacity: 0.9;
                  }
                `}
              </style>
              <input 
                type="file" 
                accept=".jpg,.jpeg,.png" 
                className={inputClasses + " file-input-orange"}
                style={inputStyle}
                onChange={(e) => setData(d => ({
                  ...d, 
                  logo: e.target.files?.[0] || null
                }))}
              />
              {data.logo && (
                <div className="flex justify-center">
                  <img 
                    src={URL.createObjectURL(data.logo)} 
                    alt="logo preview"
                    className="h-32 w-32 object-contain rounded-lg shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 3: // Social Profiles
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Social Profiles
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Connect social media accounts for {data.selectedBusiness?.businessName}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Youtube className="text-red-600 dark:text-red-400" size={20} />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">YouTube Channel</label>
                  <input 
                    className={inputClasses + " w-full"} 
                    style={inputStyle}
                    placeholder="https://youtube.com/@yourchannel"
                    value={data.social.youtube || ""} 
                    onChange={e => setData(d => ({
                      ...d, 
                      social: { ...d.social, youtube: e.target.value }
                    }))} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded"></div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instagram</label>
                  <input 
                    className={inputClasses + " w-full"} 
                    style={inputStyle}
                    placeholder="https://instagram.com/yourbusiness"
                    value={data.social.instagram || ""}
                    onChange={e => setData(d => ({
                      ...d, 
                      social: { ...d.social, instagram: e.target.value }
                    }))} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-blue-600 rounded"></div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facebook</label>
                  <input 
                    className={inputClasses + " w-full"} 
                    style={inputStyle}
                    placeholder="https://facebook.com/yourbusiness"
                    value={data.social.facebook || ""}
                    onChange={e => setData(d => ({
                      ...d, 
                      social: { ...d.social, facebook: e.target.value }
                    }))} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-black dark:bg-white rounded"></div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Twitter/X</label>
                  <input 
                    className={inputClasses + " w-full"} 
                    style={inputStyle}
                    placeholder="https://x.com/yourbusiness"
                    value={data.social.twitter || ""}
                    onChange={e => setData(d => ({
                      ...d, 
                      social: { ...d.social, twitter: e.target.value }
                    }))} 
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Review Management
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Review Management
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Flag reviews that need attention for {data.selectedBusiness?.businessName}
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select reviews that need follow-up or response:
              </p>
              {MOCK_REVIEWS.map((review: { id: string; author: string; rating: number; text: string; date: string }) => (
                <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox"
                      checked={data.flagReviews.includes(review.id)}
                      onChange={() => setData(d => ({
                        ...d,
                        flagReviews: d.flagReviews.includes(review.id)
                          ? d.flagReviews.filter(rv => rv !== review.id)
                          : [...d.flagReviews, review.id]
                      }))}
                      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{review.author}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={16} 
                              className={i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{review.date}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5: // FAQs & Service Content
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                FAQs & Service Content
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Add frequently asked questions for {data.selectedBusiness?.businessName}
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Suggested FAQs</h3>
                <div className="space-y-3">
                  {MOCK_SUGGESTED_FAQS.map((faq: { q: string; a: string }) => (
                    <div key={faq.q} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">{faq.q}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
                        </div>
                        <Button
                          variant={data.faq.some(f => f.q === faq.q) ? "secondary" : "primary"}
                          size="sm"
                          onClick={() => {
                            if (!data.faq.some(f => f.q === faq.q)) {
                              setData(d => ({ ...d, faq: [...d.faq, faq] }));
                            } else {
                              setData(d => ({ ...d, faq: d.faq.filter(f => f.q !== faq.q) }));
                            }
                          }}
                        >
                          {data.faq.some(f => f.q === faq.q) ? "Added" : "Add"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {data.services.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Service Descriptions</h3>
                  <div className="space-y-4">
                    {data.services.map(service => (
                      <div key={service}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {service}
                        </label>
                        <textarea
                          className={inputClasses + " w-full resize-none"}
                          style={inputStyle}
                          rows={3}
                          placeholder={`Describe your ${service} service...`}
                          value={data.servicesDesc[service] || ""}
                          onChange={e => setData(d => ({
                            ...d, 
                            servicesDesc: { ...d.servicesDesc, [service]: e.target.value }
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6: // Upload Images
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Upload Images & Media
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Add photos to showcase {data.selectedBusiness?.businessName}
              </p>
            </div>
            <div className="space-y-4">
              <style>
                {`
                  .file-input-orange::file-selector-button {
                    background-color: #f45a4e;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    margin-right: 16px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: opacity 0.2s;
                  }
                  .file-input-orange::file-selector-button:hover {
                    opacity: 0.9;
                  }
                `}
              </style>
              <input 
                type="file" 
                accept=".jpg,.jpeg,.png" 
                multiple 
                className={inputClasses + " file-input-orange"}
                style={inputStyle}
                onChange={e => {
                  const files = e.target.files;
                  if (!files) return;
                  const arr = Array.from(files);
                  const previews = arr.map(file => URL.createObjectURL(file));
                  setData(d => ({
                    ...d,
                    media: [...d.media, ...arr],
                    mediaPreview: [...d.mediaPreview, ...previews]
                  }));
                }}
              />
              
              {data.mediaPreview.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {data.mediaPreview.map((url, i) => (
                    <div key={i} className="relative group">
                      <img 
                        src={url} 
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700" 
                        alt={`media-${i}`} 
                      />
                      <button 
                        type="button" 
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => setData(d => ({
                          ...d,
                          media: d.media.filter((_, idx) => idx !== i),
                          mediaPreview: d.mediaPreview.filter((_, idx) => idx !== i)
                        }))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setData(d => ({ ...d, skippedMedia: !d.skippedMedia }))}
                >
                  {data.skippedMedia ? "Upload Photos" : "Skip for now"}
                </Button>
                {data.skippedMedia && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    You can upload photos later in the Media section of your dashboard.
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 7: // Notifications
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Notification Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Configure how you want to receive updates for {data.selectedBusiness?.businessName}
              </p>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Notification Methods</h3>
                <div className="space-y-3">
                  {["Email", "SMS", "In-app"].map(method => (
                    <label key={method} className="flex items-center gap-3 text-base">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        checked={data.notificationMethod.includes(method)}
                        onChange={() => setData(d => ({
                          ...d,
                          notificationMethod: d.notificationMethod.includes(method)
                            ? d.notificationMethod.filter(t => t !== method)
                            : [...d.notificationMethod, method]
                        }))}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {data.notificationMethod.includes("Email") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Email Address
                  </label>
                  <input 
                    className={inputClasses + " w-full"}
                    style={inputStyle}
                    type="email"
                    value={data.notificationEmail}
                    onChange={e => setData(d => ({ ...d, notificationEmail: e.target.value }))}
                    placeholder="Primary email for notifications"
                  />
                  <div className="flex gap-2 mt-2">
                    <input 
                      className={inputClasses + " flex-1"}
                      style={inputStyle}
                      type="email"
                      placeholder="Add CC email..."
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val && !data.ccEmails.includes(val)) {
                            setData(d => ({ ...d, ccEmails: [...d.ccEmails, val] }));
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  {data.ccEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {data.ccEmails.map(email => (
                        <span key={email} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                          {email}
                          <button 
                            type="button" 
                            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1"
                            onClick={() => setData(d => ({ ...d, ccEmails: d.ccEmails.filter(e => e !== email) }))}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {data.notificationMethod.includes("SMS") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input 
                    className={inputClasses + " w-full"}
                    style={inputStyle}
                    type="tel"
                    value={data.notificationPhone}
                    onChange={e => setData(d => ({ ...d, notificationPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Only one SMS number may be specified.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 8: // Team Members
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Invite Team Members
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Add team members to help manage {data.selectedBusiness?.businessName}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  className={inputClasses + " flex-1"}
                  style={inputStyle}
                  type="email"
                  value={data.manualTeam}
                  onChange={e => setData(d => ({ ...d, manualTeam: e.target.value }))}
                  placeholder="Enter team member email..."
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const val = data.manualTeam.trim();
                    if (val && !data.team.includes(val) && data.team.length < 3) {
                      setData(d => ({
                        ...d, 
                        team: [...d.team, val], 
                        manualTeam: ""
                      }));
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              
              {data.team.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Members to Invite:</h4>
                  <div className="space-y-2">
                    {data.team.map(email => (
                      <div key={email} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-gray-900 dark:text-white">{email}</span>
                        <button 
                          type="button" 
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => setData(d => ({ ...d, team: d.team.filter(e => e !== email) }))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You may invite up to 3 team members. Invitations will be sent when onboarding is complete.
              </p>
            </div>
          </div>
        );

      case 9: // Review & Finish
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Review & Finish
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Review all information for {data.selectedBusiness?.businessName}
              </p>
            </div>
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Business Information</h4>
                  <p className="text-gray-700 dark:text-gray-300">{data.selectedBusiness?.businessName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{data.selectedBusiness?.email}</p>
                </div>
                
                {data.keywords.length > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.keywords.map(keyword => (
                        <span key={keyword} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.services.length > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.services.map(service => (
                        <span key={service} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.faq.length > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">FAQs Added</h4>
                    <ul className="space-y-1">
                      {data.faq.map(f => (
                        <li key={f.q} className="text-sm text-gray-700 dark:text-gray-300">
                          • {f.q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {data.flagReviews.length > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Flagged Reviews</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {data.flagReviews.length} reviews flagged for follow-up
                    </p>
                  </div>
                )}
                
                {data.team.length > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Team Invitations</h4>
                    <ul className="space-y-1">
                      {data.team.map(email => (
                        <li key={email} className="text-sm text-gray-700 dark:text-gray-300">
                          • {email}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="mx-auto text-green-600 dark:text-green-400 mb-2" size={24} />
                <p className="font-semibold text-green-800 dark:text-green-300">
                  Ready to complete onboarding!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  All information will be saved to the customer's account and team invitations will be sent.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {steps[stepIdx].title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Working on {data.selectedBusiness?.businessName}
            </p>
            <div className="text-lg text-gray-500 dark:text-gray-400">
              Step content for {steps[stepIdx].title} coming soon...
            </div>
          </div>
        );
    }
  };

  if (stepIdx === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-6">
          {renderBusinessSearch()}
        </div>
      </div>
    );
  }

  const progress = Math.round(((stepIdx) / (steps.length - 1)) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <Card className="p-8 shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#f45a4e20' }}>
                <div style={{ color: '#f45a4e' }}>
                  {steps[stepIdx].icon}
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {steps[stepIdx].title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Step {stepIdx + 1} of {steps.length} • {data.selectedBusiness?.businessName}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Save Progress
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`, 
                  backgroundColor: '#f45a4e'
                }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={() => setStepIdx(s => s > 0 ? s - 1 : 0)}
              disabled={stepIdx === 0}
            >
              Previous
            </Button>
            <Button
              variant="primary"
              onClick={() => setStepIdx(s => s < steps.length - 1 ? s + 1 : s)}
              disabled={stepIdx === steps.length - 1}
            >
              {stepIdx === steps.length - 1 ? "Complete Onboarding" : "Next"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminOnboarding;