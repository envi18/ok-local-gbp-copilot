// src/lib/insertSampleData.ts
import { supabase } from './supabase';

export interface SampleDataOptions {
  force?: boolean; // Force recreation of data
  verbose?: boolean; // Log detailed output
}

export async function insertEnhancedSampleData(options: SampleDataOptions = {}) {
  const { force = false, verbose = false } = options;
  
  console.log('🚀 Starting enhanced sample data insertion...');
  
  try {
    // Check if data already exists (unless force flag is used)
    if (!force) {
      const { data: existingOrgs } = await supabase
        .from('organizations')
        .select('id')
        .limit(5);
      
      if (existingOrgs && existingOrgs.length >= 3) {
        console.log('✅ Sample data already exists. Use force: true to recreate.');
        return { success: true, skipped: true };
      }
    }

    // 1. Create Sample Organizations
    const organizations = await createSampleOrganizations(verbose);
    console.log(`✅ Created ${organizations.length} organizations`);

    // 2. Create Sample User Profiles (including test users for different roles)
    const profiles = await createSampleProfiles(organizations, verbose);
    console.log(`✅ Created ${profiles.length} user profiles`);

    // 3. Create Sample Locations
    const locations = await createSampleLocations(organizations, verbose);
    console.log(`✅ Created ${locations.length} locations`);

    // 4. Create Sample Products and Product Access
    const productAccess = await createSampleProductAccess(organizations, verbose);
    console.log(`✅ Created product access for ${productAccess.length} organizations`);

    // 5. Create Sample Reviews (if table exists)
    try {
      const reviews = await createSampleReviews(locations, verbose);
      console.log(`✅ Created ${reviews.length} reviews`);
    } catch (error) {
      console.log('ℹ️ Reviews table not available - skipping reviews');
    }

    // 6. Create Sample Posts (if table exists)
    try {
      const posts = await createSamplePosts(locations, verbose);
      console.log(`✅ Created ${posts.length} posts`);
    } catch (error) {
      console.log('ℹ️ Posts table not available - skipping posts');
    }

    // 7. Create Sample AI Visibility Data (if tables exist)
    try {
      await createSampleAIVisibilityData(organizations, verbose);
      console.log('✅ Created AI Visibility sample data');
    } catch (error) {
      console.log('ℹ️ AI Visibility tables not available - skipping');
    }

    console.log('🎉 Enhanced sample data insertion completed successfully!');
    return { 
      success: true, 
      summary: {
        organizations: organizations.length,
        profiles: profiles.length,
        locations: locations.length,
        productAccess: productAccess.length
      }
    };

  } catch (error) {
    console.error('❌ Sample data insertion failed:', error);
    return { success: false, error };
  }
}

// 1. Sample Organizations
async function createSampleOrganizations(verbose: boolean) {
  const organizations = [
    {
      name: 'OK Local Demo',
      slug: 'ok-local-demo',
      plan_tier: 'enterprise'
    },
    {
      name: 'Downtown Coffee Co',
      slug: 'downtown-coffee',
      plan_tier: 'pro'
    },
    {
      name: 'Metro Restaurants Group',
      slug: 'metro-restaurants',
      plan_tier: 'pro'
    },
    {
      name: 'Valley Healthcare Network',
      slug: 'valley-healthcare',
      plan_tier: 'enterprise'
    },
    {
      name: 'Phoenix Auto Dealers',
      slug: 'phoenix-auto',
      plan_tier: 'free'
    },
    {
      name: 'Local Services LLC',
      slug: 'local-services',
      plan_tier: 'pro'
    }
  ];

  const { data: insertedOrgs, error } = await supabase
    .from('organizations')
    .upsert(organizations, { onConflict: 'slug' })
    .select();

  if (error) throw error;

  if (verbose) {
    console.log('Organizations created:', insertedOrgs?.map(org => `${org.name} (${org.plan_tier})`));
  }

  return insertedOrgs || [];
}

// 2. Sample User Profiles
async function createSampleProfiles(organizations: any[], verbose: boolean) {
  const profiles = [
    // Admin users
    {
      id: '00000000-0000-0000-0000-000000000001', // Test admin ID
      organization_id: organizations[0].id, // OK Local Demo
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@oklocalapp.com',
      role: 'admin'
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      organization_id: organizations[0].id,
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@oklocalapp.com',
      role: 'support'
    },
    
    // Manager users
    {
      id: '00000000-0000-0000-0000-000000000003',
      organization_id: organizations[1].id, // Downtown Coffee
      first_name: 'Mike',
      last_name: 'Manager',
      email: 'mike@downtowncoffee.com',
      role: 'reseller'
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      organization_id: organizations[2].id, // Metro Restaurants
      first_name: 'Lisa',
      last_name: 'Rodriguez',
      email: 'lisa@metrorestaurants.com',
      role: 'reseller'
    },
    
    // Customer users
    {
      id: '00000000-0000-0000-0000-000000000005',
      organization_id: organizations[1].id, // Downtown Coffee
      first_name: 'Emma',
      last_name: 'Davis',
      email: 'emma@downtowncoffee.com',
      role: 'customer'
    },
    {
      id: '00000000-0000-0000-0000-000000000006',
      organization_id: organizations[2].id, // Metro Restaurants
      first_name: 'James',
      last_name: 'Wilson',
      email: 'james@metrorestaurants.com',
      role: 'customer'
    },
    {
      id: '00000000-0000-0000-0000-000000000007',
      organization_id: organizations[3].id, // Valley Healthcare
      first_name: 'Dr. Maria',
      last_name: 'Garcia',
      email: 'dr.garcia@valleyhealthcare.com',
      role: 'customer'
    },
    {
      id: '00000000-0000-0000-0000-000000000008',
      organization_id: organizations[4].id, // Phoenix Auto
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@phoenixauto.com',
      role: 'customer'
    },
    {
      id: '00000000-0000-0000-0000-000000000009',
      organization_id: organizations[5].id, // Local Services
      first_name: 'Anna',
      last_name: 'Chen',
      email: 'anna@localservices.com',
      role: 'customer'
    }
  ];

  // Insert profiles one by one to handle potential conflicts
  const insertedProfiles = [];
  for (const profile of profiles) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' })
        .select()
        .single();
      
      if (!error && data) {
        insertedProfiles.push(data);
      } else if (verbose) {
        console.log(`Profile ${profile.email} already exists or error:`, error?.message);
      }
    } catch (err) {
      if (verbose) {
        console.log(`Could not create profile ${profile.email}:`, err);
      }
    }
  }

  if (verbose) {
    console.log('Profiles created:', insertedProfiles.map(p => `${p.first_name} ${p.last_name} (${p.role})`));
  }

  return insertedProfiles;
}

// 3. Sample Locations
async function createSampleLocations(organizations: any[], verbose: boolean) {
  const locations = [
    // Downtown Coffee Co locations
    {
      organization_id: organizations[1].id,
      name: 'Downtown Coffee Main',
      description: 'Our flagship coffee shop in the heart of downtown',
      address: '123 Main St',
      city: 'Phoenix',
      state: 'Arizona',
      postal_code: '85001',
      country: 'US',
      phone: '(555) 123-4567',
      website: 'https://downtowncoffee.com',
      primary_category: 'Coffee Shop',
      rating: 4.8,
      review_count: 156,
      gbp_sync_status: 'synced'
    },
    {
      organization_id: organizations[1].id,
      name: 'Downtown Coffee Westside',
      description: 'Cozy neighborhood coffee spot',
      address: '456 Oak Ave',
      city: 'Phoenix',
      state: 'Arizona',
      postal_code: '85003',
      country: 'US',
      phone: '(555) 234-5678',
      website: 'https://downtowncoffee.com/westside',
      primary_category: 'Coffee Shop',
      rating: 4.5,
      review_count: 89,
      gbp_sync_status: 'synced'
    },
    
    // Metro Restaurants locations
    {
      organization_id: organizations[2].id,
      name: 'Central Bistro',
      description: 'Fine dining with a modern twist',
      address: '789 Pine Rd',
      city: 'Phoenix',
      state: 'Arizona',
      postal_code: '85004',
      country: 'US',
      phone: '(555) 345-6789',
      website: 'https://centralbistro.com',
      primary_category: 'Restaurant',
      rating: 4.6,
      review_count: 203,
      gbp_sync_status: 'synced'
    },
    {
      organization_id: organizations[2].id,
      name: 'Metro Pizza Palace',
      description: 'Authentic wood-fired pizza',
      address: '321 Cedar Blvd',
      city: 'Phoenix',
      state: 'Arizona',
      postal_code: '85006',
      country: 'US',
      phone: '(555) 456-7890',
      website: 'https://metropizza.com',
      primary_category: 'Pizza Restaurant',
      rating: 4.7,
      review_count: 178,
      gbp_sync_status: 'pending'
    },
    
    // Valley Healthcare locations
    {
      organization_id: organizations[3].id,
      name: 'Valley Family Health',
      description: 'Comprehensive family healthcare services',
      address: '555 Health Way',
      city: 'Phoenix',
      state: 'Arizona',
      postal_code: '85008',
      country: 'US',
      phone: '(555) 567-8901',
      website: 'https://valleyfamilyhealth.com',
      primary_category: 'Medical Clinic',
      rating: 4.9,
      review_count: 245,
      gbp_sync_status: 'synced'
    },
    
    // Phoenix Auto Dealers locations
    {
      organization_id: organizations[4].id,
      name: 'Phoenix Auto Sales',
      description: 'Quality used cars and trucks',
      address: '888 Auto Row',
      city: 'Phoenix',
      state: 'Arizona',
      postal_code: '85010',
      country: 'US',
      phone: '(555) 678-9012',
      website: 'https://phoenixauto.com',
      primary_category: 'Car Dealer',
      rating: 4.2,
      review_count: 67,
      gbp_sync_status: 'error'
    },
    
    // Local Services locations
    {
      organization_id: organizations[5].id,
      name: 'Phoenix Home Repairs',
      description: 'Professional home maintenance and repair services',
      address: '777 Service Dr',
      city: 'Phoenix',
      state: 'Arizona',
      postal_code: '85012',
      country: 'US',
      phone: '(555) 789-0123',
      website: 'https://phoenixhomerepairs.com',
      primary_category: 'Home Improvement',
      rating: 4.4,
      review_count: 134,
      gbp_sync_status: 'synced'
    }
  ];

  const { data: insertedLocations, error } = await supabase
    .from('locations')
    .upsert(locations, { onConflict: 'name,organization_id' })
    .select();

  if (error) throw error;

  if (verbose) {
    console.log('Locations created:', insertedLocations?.map(loc => `${loc.name} (${loc.primary_category})`));
  }

  return insertedLocations || [];
}

// 4. Sample Product Access
async function createSampleProductAccess(organizations: any[], verbose: boolean) {
  try {
    // First, ensure products exist
    const products = [
      {
        name: 'gbp_management',
        display_name: 'Google Business Profile Management',
        description: 'Complete GBP management including reviews, posts, and media',
        tier: 'basic'
      },
      {
        name: 'premium_listings',
        display_name: 'Premium Listings',
        description: 'Enhanced business listings across multiple platforms',
        tier: 'premium'
      },
      {
        name: 'ai_visibility',
        display_name: 'AI Visibility',
        description: 'Track and optimize your business visibility across AI platforms',
        tier: 'premium'
      },
      {
        name: 'voice_search',
        display_name: 'Voice Search Optimization',
        description: 'Optimize your business for voice search queries',
        tier: 'premium'
      }
    ];

    const { data: insertedProducts } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'name' })
      .select();

    if (!insertedProducts) return [];

    // Create product access for organizations
    const organizationProducts = [
      // OK Local Demo (enterprise) - all products
      ...insertedProducts.map(product => ({
        organization_id: organizations[0].id,
        product_id: product.id,
        granted_at: new Date().toISOString(),
        granted_by: '00000000-0000-0000-0000-000000000001' // Admin user
      })),
      
      // Downtown Coffee (pro) - gbp + premium features
      {
        organization_id: organizations[1].id,
        product_id: insertedProducts.find(p => p.name === 'gbp_management')?.id,
        granted_at: new Date().toISOString(),
        granted_by: '00000000-0000-0000-0000-000000000001'
      },
      {
        organization_id: organizations[1].id,
        product_id: insertedProducts.find(p => p.name === 'premium_listings')?.id,
        granted_at: new Date().toISOString(),
        granted_by: '00000000-0000-0000-0000-000000000001'
      },
      
      // Metro Restaurants (pro) - gbp + ai_visibility
      {
        organization_id: organizations[2].id,
        product_id: insertedProducts.find(p => p.name === 'gbp_management')?.id,
        granted_at: new Date().toISOString(),
        granted_by: '00000000-0000-0000-0000-000000000001'
      },
      {
        organization_id: organizations[2].id,
        product_id: insertedProducts.find(p => p.name === 'ai_visibility')?.id,
        granted_at: new Date().toISOString(),
        granted_by: '00000000-0000-0000-0000-000000000001'
      },
      
      // Valley Healthcare (enterprise) - all products
      ...insertedProducts.map(product => ({
        organization_id: organizations[3].id,
        product_id: product.id,
        granted_at: new Date().toISOString(),
        granted_by: '00000000-0000-0000-0000-000000000001'
      })),
      
      // Phoenix Auto (free) - only basic gbp
      {
        organization_id: organizations[4].id,
        product_id: insertedProducts.find(p => p.name === 'gbp_management')?.id,
        granted_at: new Date().toISOString(),
        granted_by: '00000000-0000-0000-0000-000000000001'
      }
      
      // Local Services (pro) gets no products initially - for testing upgrade requests
    ];

    const { data: insertedOrgProducts } = await supabase
      .from('organization_products')
      .upsert(organizationProducts.filter(item => item.product_id), { onConflict: 'organization_id,product_id' })
      .select();

    if (verbose) {
      console.log('Product access created for organizations:', insertedOrgProducts?.length);
    }

    return insertedOrgProducts || [];

  } catch (error) {
    if (verbose) {
      console.log('Could not create product access:', error);
    }
    return [];
  }
}

// 5. Sample Reviews
async function createSampleReviews(locations: any[], verbose: boolean) {
  if (!locations.length) return [];

  const reviews = [];
  
  // Create 2-3 reviews per location
  for (const location of locations.slice(0, 5)) { // Limit to first 5 locations
    const locationReviews = [
      {
        location_id: location.id,
        author_name: 'Sarah Johnson',
        rating: 5,
        text: `Amazing experience at ${location.name}! Highly recommend.`,
        sentiment: 'positive',
        platform: 'google',
        created_at_external: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        location_id: location.id,
        author_name: 'Mike Chen',
        rating: 4,
        text: `Good service at ${location.name}, will visit again.`,
        sentiment: 'positive',
        platform: 'google',
        created_at_external: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        location_id: location.id,
        author_name: 'Emma Davis',
        rating: 3,
        text: `Average experience. Could be better.`,
        response_text: 'Thank you for your feedback! We are always working to improve.',
        sentiment: 'neutral',
        platform: 'google',
        created_at_external: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        responded_at: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    reviews.push(...locationReviews);
  }

  const { data: insertedReviews, error } = await supabase
    .from('reviews')
    .upsert(reviews)
    .select();

  if (error) throw error;

  return insertedReviews || [];
}

// 6. Sample Posts
async function createSamplePosts(locations: any[], verbose: boolean) {
  if (!locations.length) return [];

  const posts = [];
  
  // Create 1-2 posts per location
  for (const location of locations.slice(0, 4)) { // Limit to first 4 locations
    const locationPosts = [
      {
        location_id: location.id,
        title: `New updates at ${location.name}!`,
        body: `Exciting things happening at ${location.name}. Come visit us and see what's new!`,
        status: 'published',
        platform: ['gbp'],
        view_count: Math.floor(Math.random() * 500) + 50,
        click_count: Math.floor(Math.random() * 50) + 5,
        published_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    posts.push(...locationPosts);
  }

  const { data: insertedPosts, error } = await supabase
    .from('posts')
    .upsert(posts)
    .select();

  if (error) throw error;

  return insertedPosts || [];
}

// 7. Sample AI Visibility Data
async function createSampleAIVisibilityData(organizations: any[], verbose: boolean) {
  // This would create sample data for AI visibility reports
  // Only attempt if tables exist
  const reportData = {
    organization_id: organizations[0].id, // OK Local Demo
    month: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
    overall_score: 82,
    chatgpt_score: 85,
    claude_score: 78,
    gemini_score: 90,
    perplexity_score: 75,
    created_at: new Date().toISOString()
  };

  try {
    const { data } = await supabase
      .from('ai_visibility_reports')
      .upsert(reportData, { onConflict: 'organization_id,month' })
      .select();
    
    return data;
  } catch (error) {
    // Table doesn't exist, that's fine
    return null;
  }
}

// Utility function to run from console/component
export async function runEnhancedSampleDataInsertion() {
  console.log('🎯 Running enhanced sample data insertion...');
  const result = await insertEnhancedSampleData({ verbose: true });
  
  if (result.success) {
    console.log('✅ Sample data ready for development!');
    console.log('📊 Summary:', result.summary);
  } else {
    console.error('❌ Failed to insert sample data:', result.error);
  }
  
  return result;
}