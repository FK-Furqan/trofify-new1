const express = require('express');
const supabase = require('./db');
require('dotenv').config();

const router = express.Router();

// Signup endpoint: direct insert into users and type-specific tables (no Supabase Auth)
router.post('/', async (req, res) => {
  const { email, password, user_type, displayName, phoneNumber, ...profileData } = req.body;
  try {
    // 1. Check if user already exists
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    // 2. Insert into users table
    const { data: userData, error: userError } = await supabase.from('users').insert({
      email,
      password_hash: password, // Store password in password_hash column for now
      user_type,
      phone_number: phoneNumber || null,
      display_name: displayName || null
    }).select().single();
    if (userError) {
      return res.status(500).json({ error: userError.message });
    }
    const user_id = userData.id;
    // 3. Insert into type-specific table
    if (user_type === 'athlete') {
      const { fullName, sport, level, achievements, dateOfBirth, location } = profileData;
      await supabase.from('athletes').insert({
        user_id,
        full_name: fullName,
        sport,
        level,
        achievements,
        date_of_birth: dateOfBirth,
        location
      });
    } else if (user_type === 'coach') {
      const { fullName, sport, experience, certifications, specialization, organization, location } = profileData;
      await supabase.from('coaches').insert({
        user_id,
        full_name: fullName,
        sport,
        experience,
        certifications,
        specialization,
        organization,
        location
      });
    } else if (user_type === 'fan') {
      const { fullName, favoriteSports, favoriteTeams, interests, location } = profileData;
      await supabase.from('fans').insert({
        user_id,
        full_name: fullName,
        favorite_sports: (favoriteSports || []).join(','),
        favorite_teams: favoriteTeams,
        interests,
        location
      });
    } else if (user_type === 'venue') {
      const { ownerName, venueName, venueType, phoneNumber } = profileData;
      await supabase.from('venues').insert({
        user_id,
        owner_name: ownerName,
        venue_name: venueName,
        venue_type: venueType,
        phone_number: phoneNumber
      });
    } else if (user_type === 'sports_brand') {
      const { contactName, brandName, companyType, website, phoneNumber, address, city, state, zipCode, productCategories, targetMarkets, description } = profileData;
      await supabase.from('sports_brands').insert({
        user_id,
        contact_name: contactName,
        brand_name: brandName,
        company_type: companyType,
        website,
        phone_number: phoneNumber,
        address,
        city,
        state,
        zip_code: zipCode,
        product_categories: (productCategories || []).join(','),
        target_markets: (targetMarkets || []).join(','),
        description
      });
    } else if (user_type === 'media_creator') {
      const { fullName, mediaType, phoneNumber } = profileData;
      await supabase.from('media_creators').insert({
        user_id,
        full_name: fullName,
        media_type: mediaType,
        phone_number: phoneNumber
      });
    } else if (user_type === 'organization_institute') {
      const { contactName, organizationName, organizationType, phoneNumber } = profileData;
      await supabase.from('organizations_institutes').insert({
        user_id,
        contact_name: contactName,
        organization_name: organizationName,
        organization_type: organizationType,
        phone_number: phoneNumber
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login endpoint: direct table check (no Supabase Auth)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, user_type, display_name')
      .eq('email', email)
      .single();
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // For now, plain text comparison (do NOT use in production)
    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    // Return user info (omit password_hash)
    const { password_hash, ...userInfo } = user;
    res.json({ success: true, user: userInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile by email
router.post('/profile', async (req, res) => {
  const { email } = req.body;
  try {
    // Get user base info including avatar from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, user_type, display_name, avatar')
      .eq('email', email)
      .single();
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If user already has an avatar in the users table, use that
    if (user.avatar) {
      console.log('Using avatar from users table:', user.avatar);
      return res.json(user);
    }

    // Fallback: Get profile image from profile-photo bucket (if exists)
    let avatar = null;
    try {
      const { data: mediaData, error: mediaError } = await supabase
        .storage
        .from('profile-photo')
        .list(user.id + '/', { limit: 1, offset: 0 });
      if (mediaData && mediaData.length > 0) {
        // Get the first file in the user's folder
        const fileName = mediaData[0].name;
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('profile-photo')
          .createSignedUrl(user.id + '/' + fileName, 60 * 60 * 24);
        if (!signedUrlError && signedUrlData) {
          avatar = signedUrlData.signedUrl;
          
          // Update the users table with this avatar for future requests
          await supabase
            .from('users')
            .update({ avatar: avatar })
            .eq('id', user.id);
        }
      }
    } catch (mediaErr) {
      console.log('No avatar found in storage:', mediaErr);
    }
    
    res.json({ ...user, avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile endpoint
router.post('/update-profile', async (req, res) => {
  const { userType, profileData } = req.body;
  const { email } = profileData;
  
  try {
    // Get user ID from email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user_id = user.id;

    // Update base user info
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        display_name: profileData.display_name,
        phone_number: profileData.phone_number
      })
      .eq('id', user_id);

    if (updateUserError) {
      return res.status(500).json({ error: 'Failed to update user info' });
    }

    // Update type-specific profile data
    let updateError = null;
    
    switch (userType) {
      case 'venue':
        const { error: venueError } = await supabase
          .from('venues')
          .update({
            owner_name: profileData.owner_name,
            venue_name: profileData.venue_name,
            venue_type: profileData.venue_type,
            address: profileData.address,
            city: profileData.city,
            state: profileData.state,
            zip_code: profileData.zip_code,
            website: profileData.website,
            capacity: profileData.capacity,
            facilities: profileData.facilities,
            description: profileData.description,
            phone_number: profileData.phone_number
          })
          .eq('user_id', user_id);
        updateError = venueError;
        break;

      case 'media_creator':
        const { error: mediaError } = await supabase
          .from('media_creators')
          .update({
            full_name: profileData.full_name,
            media_type: profileData.media_type,
            specialization: profileData.specialization,
            experience: profileData.experience,
            portfolio_url: profileData.portfolio_url,
            social_media_handles: profileData.social_media_handles,
            equipment: profileData.equipment,
            location: profileData.location,
            description: profileData.description,
            phone_number: profileData.phone_number
          })
          .eq('user_id', user_id);
        updateError = mediaError;
        break;

      case 'organization_institute':
        const { error: orgError } = await supabase
          .from('organizations_institutes')
          .update({
            contact_name: profileData.contact_name,
            organization_name: profileData.organization_name,
            organization_type: profileData.organization_type,
            website: profileData.website,
            address: profileData.address,
            city: profileData.city,
            state: profileData.state,
            zip_code: profileData.zip_code,
            founded_year: profileData.founded_year,
            mission_statement: profileData.mission_statement,
            programs_services: profileData.programs_services,
            target_audience: profileData.target_audience,
            description: profileData.description,
            phone_number: profileData.phone_number
          })
          .eq('user_id', user_id);
        updateError = orgError;
        break;

      default:
        return res.status(400).json({ error: 'Unsupported user type' });
    }

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update profile data' });
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

module.exports = router; 
