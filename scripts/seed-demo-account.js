/**
 * Seed script for unified Plately Demo Account
 * Creates / updates demo@plately.app with password '12345678'
 * Configures both Workshop merchant owner role and Plately mobile consumer profile.
 *
 * Usage:
 *   node scripts/seed-demo-account.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tquyodwsyppwbpvkaunn.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = 'demo@plately.app';
const DEMO_PASSWORD = 'password123'; // or '12345678'
const TARGET_PASSWORD = '12345678';
const RESTAURANT_ID = '7e1dd08c-c95d-496b-86d0-f7b40d7f9cdf'; // Kamolon
const RESTAURANT_NAME = 'Kamolon';
const RESTAURANT_SLUG = 'kamolon-b87695';
const BRANCH_ID = '5ba11ac4-2e44-4ee2-9faa-15ae7db68574';

async function main() {
  console.log(`Setting up demo account: ${DEMO_EMAIL}...`);

  // 1. Check if user exists in auth
  const { data: userList } = await supabase.auth.admin.listUsers();
  let user = userList?.users?.find((u) => u.email === DEMO_EMAIL);

  const metadata = {
    display_name: 'Demo Manager',
    name: 'Demo Manager',
    role: 'owner',
    restaurant_id: RESTAURANT_ID,
    restaurant_name: RESTAURANT_NAME,
    restaurant_slug: RESTAURANT_SLUG,
    branch_id: BRANCH_ID,
  };

  const appMetadata = {
    restaurant_id: RESTAURANT_ID,
    restaurant_name: RESTAURANT_NAME,
    restaurant_slug: RESTAURANT_SLUG,
    branch_id: BRANCH_ID,
    staff_role: 'owner',
    role: 'owner',
  };

  if (!user) {
    console.log('Creating auth user...');
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: TARGET_PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: appMetadata,
    });
    if (createErr) throw createErr;
    user = newUser.user;
    console.log(`Created auth user: ${user.id}`);
  } else {
    console.log(`Existing user found: ${user.id}. Updating password and metadata...`);
    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: TARGET_PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: appMetadata,
    });
    if (updateErr) throw updateErr;
    console.log('Auth user updated.');
  }

  // 2. Upsert public.users for consumer Plately App
  console.log('Configuring public.users profile...');
  const { error: profileErr } = await supabase.from('users').upsert({
    id: user.id,
    email: DEMO_EMAIL,
    display_name: 'Demo Manager',
    username: 'demo',
    onboarding_done: true,
    household_size: 2,
    daily_calorie_goal: 2000,
    dietary_tags: [],
    dietary_preferences: [],
    allergies: [],
  });
  if (profileErr) console.warn('Warning updating public.users:', profileErr.message);

  // 3. Upsert public.staff for Workshop Merchant OS
  console.log('Configuring public.staff link...');
  const { error: staffErr } = await supabase.from('staff').upsert(
    {
      user_id: user.id,
      restaurant_id: RESTAURANT_ID,
      branch_id: BRANCH_ID,
      role: 'owner',
      display_name: 'Demo Manager',
      email: DEMO_EMAIL,
      is_active: true,
    },
    { onConflict: 'user_id,restaurant_id' }
  );
  if (staffErr) console.warn('Warning updating public.staff:', staffErr.message);

  // 4. Ensure menu items exist for restaurant
  const { data: existingItems } = await supabase
    .from('menu_items')
    .select('id')
    .eq('restaurant_id', RESTAURANT_ID);

  if (!existingItems || existingItems.length === 0) {
    console.log('Seeding menu items for Kamolon...');
    await supabase.from('menu_items').insert([
      {
        restaurant_id: RESTAURANT_ID,
        name: "To'y Oshi (Wedding Plov)",
        description: 'Signature Tashkent wedding plov slow-cooked with tender beef, lamb, yellow carrots, chickpeas, raisins, and quail egg.',
        price: 48000,
        category: 'Main',
        is_available: true,
        calories: 780,
        tags: ['bestseller', 'national', 'signature'],
        sort_order: 1,
        is_featured: true,
        prep_time_minutes: 15,
      },
      {
        restaurant_id: RESTAURANT_ID,
        name: 'Tandir Somsa (Tandoor Samosa)',
        description: 'Crispy flaky clay-oven baked pastry loaded with hand-minced spiced beef, sweet onions, and melted tail fat.',
        price: 15000,
        category: 'Pastry',
        is_available: true,
        calories: 320,
        tags: ['hot', 'crispy', 'popular'],
        sort_order: 2,
        is_featured: true,
        prep_time_minutes: 10,
      },
      {
        restaurant_id: RESTAURANT_ID,
        name: "Qo'y Go'shti Shashlik (Lamb Kebab)",
        description: 'Succulent skewers of tender marinated lamb cubes grilled over natural charcoal, served with vinegar-herb onions.',
        price: 26000,
        category: 'Grill',
        is_available: true,
        calories: 450,
        tags: ['bbq', 'charcoal', 'grill'],
        sort_order: 3,
        is_featured: true,
        prep_time_minutes: 20,
      },
      {
        restaurant_id: RESTAURANT_ID,
        name: "Qovurma Lag'mon (Fried Lagman)",
        description: 'Chewy hand-stretched noodles stir-fried in a hot wok with beef slivers, bell peppers, garlic greens, and rich spices.',
        price: 42000,
        category: 'Main',
        is_available: true,
        calories: 620,
        tags: ['noodles', 'spicy', 'comfort'],
        sort_order: 4,
        is_featured: false,
        prep_time_minutes: 18,
      },
      {
        restaurant_id: RESTAURANT_ID,
        name: 'Achichuk Salad',
        description: 'Paper-thin Tashkent tomatoes, sweet sweet onions, crushed chili pepper, and fresh purple basil.',
        price: 14000,
        category: 'Salad',
        is_available: true,
        calories: 95,
        tags: ['fresh', 'traditional', 'vegan'],
        sort_order: 5,
        is_featured: false,
        prep_time_minutes: 5,
      },
      {
        restaurant_id: RESTAURANT_ID,
        name: "Samarkand Ko'k Choy (Green Tea)",
        description: 'Fragrant No. 95 Uzbek green tea served in an authentic porcelain teapot with fresh lemon slice and mint sprig.',
        price: 12000,
        category: 'Beverages',
        is_available: true,
        calories: 0,
        tags: ['tea', 'traditional', 'refreshing'],
        sort_order: 6,
        is_featured: false,
        prep_time_minutes: 5,
      },
    ]);
  }

  // 5. Ensure inventory items exist for user's Living Shelf
  const { data: existingInv } = await supabase
    .from('inventory_items')
    .select('id')
    .eq('user_id', user.id);

  if (!existingInv || existingInv.length === 0) {
    console.log('Seeding Living Shelf pantry items...');
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    await supabase.from('inventory_items').insert([
      {
        user_id: user.id,
        ingredient_id: 'ab0e2326-0391-4f00-912c-e93ea383e613', // Eggs
        quantity: 10,
        unit: 'piece',
        item_state: 'opened',
        location: 'fridge',
        source: 'manual',
        purchase_date: today,
        computed_expiry: twoWeeks,
      },
      {
        user_id: user.id,
        ingredient_id: '574a087a-c223-4419-a4b7-dbd9ac8f8bde', // Whole milk
        quantity: 1,
        unit: 'piece',
        item_state: 'opened',
        location: 'fridge',
        source: 'manual',
        purchase_date: today,
        computed_expiry: nextWeek,
      },
      {
        user_id: user.id,
        ingredient_id: '6da58018-9bb8-4c01-8ebf-5a40ec80cdcf', // Tomato
        quantity: 4,
        unit: 'piece',
        item_state: 'opened',
        location: 'fridge',
        source: 'camera',
        purchase_date: today,
        computed_expiry: nextWeek,
      },
      {
        user_id: user.id,
        ingredient_id: '55140b39-cd86-413b-985e-b9c2bad62799', // Ripe bananas
        quantity: 3,
        unit: 'piece',
        item_state: 'opened',
        location: 'pantry',
        source: 'manual',
        purchase_date: today,
        computed_expiry: nextWeek,
      },
    ]);
  }

  console.log('\nDemo account setup complete!');
  console.log('Credentials:');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${TARGET_PASSWORD}`);
  console.log(`  Role:     owner (Restaurant: ${RESTAURANT_NAME} / ${RESTAURANT_SLUG})`);
}

main().catch(console.error);
