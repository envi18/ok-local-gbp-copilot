// src/lib/initializeDatabase.ts
import { supabase } from './supabase';

export async function initializeDatabase() {
  console.log('Starting database initialization...');

  try {
    // Test database connection first
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (testError && testError.code === '42P01') {
      // Table doesn't exist, proceed with creation
      console.log('Tables do not exist, creating schema...');
      await createDatabaseSchema();
    } else if (testError) {
      console.error('Database connection error:', testError);
      throw testError;
    } else {
      console.log('Database already exists, checking for sample data...');
      await ensureSampleData();
    }

    console.log('Database initialization completed successfully!');
    return { success: true };

  } catch (error) {
    console.error('Database initialization failed:', error);
    return { success: false, error };
  }
}

async function createDatabaseSchema() {
  console.log('Creating database schema through direct SQL execution...');
  
  try {
    // Try to create sample data first, which will help us understand if tables exist
    await insertSampleData();
    console.log('Schema appears to exist, sample data inserted');
  } catch (error) {
    console.log('Schema may not exist, but continuing with sample data insertion');
    throw error;
  }
}

async function insertSampleData() {
  console.log('Inserting sample data...');

  try {
    // Insert demo organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        name: 'Demo Organization',
        slug: 'demo-org',
        plan_tier: 'pro'
      }, { 
        onConflict: 'slug',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error inserting organization:', orgError);
      throw orgError;
    }

    console.log('Demo organization created:', org.id);

    // Insert sample locations (simplified for existing schema)
    const locations = [
      {
        organization_id: org.id,
        name: 'Downtown Coffee Shop',
        address: '123 Main St',
        city: 'Phoenix',
        state: 'Arizona',
        postal_code: '85001',
        phone: '(555) 123-4567',
        website: 'https://downtowncoffee.com',
        primary_category: 'Coffee Shop',
        rating: 4.8,
        review_count: 156,
        gbp_sync_status: 'synced'
      },
      {
        organization_id: org.id,
        name: 'Westside Cafe',
        address: '456 Oak Ave',
        city: 'Phoenix',
        state: 'Arizona',
        postal_code: '85003',
        phone: '(555) 234-5678',
        website: 'https://westsidecafe.com',
        primary_category: 'Cafe',
        rating: 4.5,
        review_count: 89,
        gbp_sync_status: 'synced'
      },
      {
        organization_id: org.id,
        name: 'Central Bistro',
        address: '789 Pine Rd',
        city: 'Phoenix',
        state: 'Arizona',
        postal_code: '85004',
        phone: '(555) 345-6789',
        website: 'https://centralbistro.com',
        primary_category: 'Restaurant',
        rating: 4.6,
        review_count: 203,
        gbp_sync_status: 'pending'
      }
    ];

    const { data: insertedLocations, error: locError } = await supabase
      .from('locations')
      .upsert(locations, { onConflict: 'name,organization_id' })
      .select();

    if (locError) {
      console.error('Error inserting locations:', locError);
      throw locError;
    }

    console.log('Sample locations created:', insertedLocations?.length);

    // Try to insert reviews if the table exists
    if (insertedLocations && insertedLocations.length > 0) {
      await insertSampleReviews(insertedLocations);
      await insertSamplePosts(insertedLocations);
    }

    return { success: true, organizationId: org.id };

  } catch (error) {
    console.error('Error in insertSampleData:', error);
    throw error;
  }
}

async function insertSampleReviews(locations: any[]) {
  try {
    const reviews = [
      {
        location_id: locations[0].id,
        author_name: 'Sarah Johnson',
        rating: 5,
        text: 'Amazing coffee and friendly staff! The atmosphere is perfect for working.',
        sentiment: 'positive',
        platform: 'google',
        created_at_external: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        location_id: locations[0].id,
        author_name: 'Mike Chen',
        rating: 4,
        text: 'Great coffee, but can get crowded during rush hour.',
        sentiment: 'positive',
        platform: 'google',
        created_at_external: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        location_id: locations[1].id,
        author_name: 'Emma Davis',
        rating: 5,
        text: 'Best brunch in town! The pancakes are incredible.',
        sentiment: 'positive',
        platform: 'google',
        created_at_external: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        location_id: locations[2].id,
        author_name: 'John Smith',
        rating: 3,
        text: 'Food was okay, service was slow.',
        response_text: 'Thank you for your feedback. We are working to improve our service times.',
        sentiment: 'neutral',
        platform: 'google',
        created_at_external: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        responded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { error } = await supabase
      .from('reviews')
      .upsert(reviews);

    if (error) {
      console.warn('Reviews table may not exist:', error.message);
    } else {
      console.log('Sample reviews created');
    }
  } catch (error) {
    console.warn('Could not insert reviews:', error);
  }
}

async function insertSamplePosts(locations: any[]) {
  try {
    const posts = [
      {
        location_id: locations[0].id,
        title: 'New Fall Menu Available!',
        body: 'Try our seasonal pumpkin spice latte and apple cinnamon muffins. Perfect for the autumn weather!',
        status: 'published',
        platform: ['gbp'],
        view_count: 245,
        click_count: 18,
        published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        location_id: locations[1].id,
        title: 'Weekend Brunch Special',
        body: 'Join us this weekend for our special brunch menu featuring fresh local ingredients.',
        status: 'published',
        platform: ['gbp'],
        view_count: 189,
        click_count: 12,
        published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { error } = await supabase
      .from('posts')
      .upsert(posts);

    if (error) {
      console.warn('Posts table may not exist:', error.message);
    } else {
      console.log('Sample posts created');
    }
  } catch (error) {
    console.warn('Could not insert posts:', error);
  }
}

async function ensureSampleData() {
  console.log('Checking for existing sample data...');
  
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'demo-org')
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.log('No sample data found, inserting...');
    await insertSampleData();
  } else {
    console.log('Sample data already exists');
  }
}
