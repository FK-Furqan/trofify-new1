const express = require('express');
const cors = require('cors');
const signupRoute = require('./signup');
require('dotenv').config();
const supabase = require('./db');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();

// Configure multer for memory storage (we'll upload to Supabase)
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
  origin: [
    'https://www.trofify.com',
    'https://trofify.com',
    'http://localhost:8080',
    'http://localhost:8081' // Added for local frontend testing
  ],
  credentials: true
}));
app.use(express.json());

app.use('/signup', signupRoute);

// Debug endpoint to check all users
app.get('/api/debug/users', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id, email, user_type');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === MEDIA UPLOAD ENDPOINTS ===

// Upload profile image to profile-photo bucket
app.post('/api/upload/profile-image', upload.single('file'), async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!req.file || !user_id) {
      return res.status(400).json({ error: 'File and user_id required' });
    }

    const fileName = `${user_id}/${Date.now()}-${req.file.originalname}`;
    
    const { data, error } = await supabase.storage
      .from('profile-photo')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photo')
      .getPublicUrl(fileName);

    // Store in user_media table
    await supabase.from('user_media').insert({
      user_id,
      media_url: publicUrl,
      media_type: 'profile_image',
      is_active: true
    });

    res.json({ url: publicUrl, message: 'Profile image uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload profile image to profile-image bucket and update user avatar
app.post('/api/upload-profile-image', upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!req.file || !userId) {
      return res.status(400).json({ error: 'File and userId required' });
    }

    const fileName = `${userId}/${Date.now()}-${req.file.originalname}`;
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-photo')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photo')
      .getPublicUrl(fileName);

    // Update user avatar in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    res.json({ imageUrl: publicUrl, message: 'Profile image uploaded and user updated successfully' });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload post media to post bucket
app.post('/api/upload/post-media', upload.single('file'), async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!req.file || !user_id) {
      return res.status(400).json({ error: 'File and user_id required' });
    }

    const fileName = `${user_id}/${Date.now()}-${req.file.originalname}`;
    
    const { data, error } = await supabase.storage
      .from('post')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post')
      .getPublicUrl(fileName);

    res.json({ url: publicUrl, message: 'Post media uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload story media to story bucket
app.post('/api/upload/story-media', upload.single('file'), async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!req.file || !user_id) {
      return res.status(400).json({ error: 'File and user_id required' });
    }

    const fileName = `${user_id}/${Date.now()}-${req.file.originalname}`;
    
    const { data, error } = await supabase.storage
      .from('story')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('story')
      .getPublicUrl(fileName);

    res.json({ url: publicUrl, message: 'Story media uploaded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === POSTS ENDPOINTS ===

// Create a new post
app.post('/api/posts', async (req, res) => {
  try {
    const { user_id, media_url, media_type, description } = req.body;
    
    const { data, error } = await supabase.from('posts').insert({
      user_id,
      media_url,
      media_type,
      description
    }).select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all posts with user info
app.get('/api/posts', async (req, res) => {
  try {
    // First get posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    // Then get user info for each post
    const postsWithUsers = await Promise.all(
      posts.map(async (post) => {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, display_name, email, user_type, avatar')
          .eq('id', post.user_id)
          .single();

        if (userError || !user) {
          return {
            ...post,
            users: { display_name: 'Unknown User', email: 'unknown@example.com', avatar: '/placeholder.svg', user_type: 'athlete' }
          };
        }

        // Get sport information from type-specific table
        let sport = null;
        if (user.user_type === 'athlete') {
          const { data: athleteData } = await supabase
            .from('athletes')
            .select('sport')
            .eq('user_id', user.id)
            .single();
          sport = athleteData?.sport;
        } else if (user.user_type === 'coach') {
          const { data: coachData } = await supabase
            .from('coaches')
            .select('sport')
            .eq('user_id', user.id)
            .single();
          sport = coachData?.sport;
        }

        return {
          ...post,
          users: {
            ...user,
            sport: sport
          }
        };
      })
    );

    res.json(postsWithUsers);
  } catch (error) {
    console.error('Posts fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get posts by user
app.get('/api/posts/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        users!inner(id, display_name, email, avatar),
        post_likes(count),
        post_comments(count)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like a post
app.post('/api/posts/:post_id/like', async (req, res) => {
  try {
    const { post_id } = req.params;
    const { user_id } = req.body;

    const { data, error } = await supabase.from('post_likes').insert({
      user_id,
      post_id: parseInt(post_id)
    });

    if (error) throw error;
    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlike a post
app.delete('/api/posts/:post_id/like', async (req, res) => {
  try {
    const { post_id } = req.params;
    const { user_id } = req.body;

    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', parseInt(post_id))
      .eq('user_id', user_id);

    if (error) throw error;
    res.json({ message: 'Post unliked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to post
app.post('/api/posts/:post_id/comments', async (req, res) => {
  try {
    const { post_id } = req.params;
    const { user_id, comment } = req.body;

    const { data, error } = await supabase.from('post_comments').insert({
      user_id,
      post_id: parseInt(post_id),
      comment
    }).select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comments for a post
app.get('/api/posts/:post_id/comments', async (req, res) => {
  try {
    const { post_id } = req.params;
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        users!inner(id, display_name, email)
      `)
      .eq('post_id', parseInt(post_id))
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save a post
app.post('/api/posts/:post_id/save', async (req, res) => {
  try {
    const { post_id } = req.params;
    const { user_id } = req.body;

    const { data, error } = await supabase.from('post_saves').insert({
      user_id,
      post_id: parseInt(post_id)
    });

    if (error) throw error;
    res.json({ message: 'Post saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unsave a post
app.delete('/api/posts/:post_id/save', async (req, res) => {
  try {
    const { post_id } = req.params;
    const { user_id } = req.body;

    const { error } = await supabase
      .from('post_saves')
      .delete()
      .eq('post_id', parseInt(post_id))
      .eq('user_id', user_id);

    if (error) throw error;
    res.json({ message: 'Post unsaved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Share a post
app.post('/api/posts/:post_id/share', async (req, res) => {
  try {
    const { post_id } = req.params;
    const { user_id } = req.body;

    const { data, error } = await supabase.from('post_shares').insert({
      user_id,
      post_id: parseInt(post_id)
    });

    if (error) throw error;
    res.json({ message: 'Post shared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get action counts for a post (likes, comments, shares, saves)
app.get('/api/posts/:post_id/actions', async (req, res) => {
  try {
    const { post_id } = req.params;

    // Likes
    const { data: likes, error: likesError } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('post_id', post_id);

    // Comments
    const { data: comments, error: commentsError } = await supabase
      .from('post_comments')
      .select('user_id, comment')
      .eq('post_id', post_id);

    // Shares
    const { data: shares, error: sharesError } = await supabase
      .from('post_shares')
      .select('user_id')
      .eq('post_id', post_id);

    // Saves
    const { data: saves, error: savesError } = await supabase
      .from('post_saves')
      .select('user_id')
      .eq('post_id', post_id);

    if (likesError || commentsError || sharesError || savesError) {
      throw likesError || commentsError || sharesError || savesError;
    }

    res.json({
      likes: likes || [],
      comments: comments || [],
      shares: shares || [],
      saves: saves || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === STORIES ENDPOINTS ===

// Create a new story
app.post('/api/stories', async (req, res) => {
  try {
    console.log('Stories POST request received:', req.body);
    const { user_id, media_url } = req.body;
    
    console.log('Creating story with:', { user_id, media_url });
    
    const { data, error } = await supabase.from('stories').insert({
      user_id,
      media_url
    }).select().single();

    if (error) {
      console.error('Supabase stories insert error:', error);
      throw error;
    }
    
    console.log('Story created successfully:', data);
    res.json(data);
  } catch (error) {
    console.error('Stories creation failed:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all stories with user info (last 24 hours)
app.get('/api/stories', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // First get stories
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (storiesError) throw storiesError;

    // Then get user info for each story
    const storiesWithUsers = await Promise.all(
      stories.map(async (story) => {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, display_name, email, user_type, avatar')
          .eq('id', story.user_id)
          .single();

        return {
          ...story,
          users: user || { display_name: 'Unknown User', email: 'unknown@example.com' }
        };
      })
    );

    res.json(storiesWithUsers);
  } catch (error) {
    console.error('Stories fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get stories by user
app.get('/api/stories/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // First get stories
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', user_id)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (storiesError) throw storiesError;

    // Then get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, display_name, email, user_type, avatar')
      .eq('id', user_id)
      .single();

    const storiesWithUsers = stories.map(story => ({
      ...story,
      users: user || { display_name: 'Unknown User', email: 'unknown@example.com' }
    }));

    res.json(storiesWithUsers);
  } catch (error) {
    console.error('User stories fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a story
app.delete('/api/stories/:story_id', async (req, res) => {
  try {
    const { story_id } = req.params;
    const { user_id } = req.body;

    // Verify ownership before deletion
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', parseInt(story_id))
      .eq('user_id', user_id);

    if (error) throw error;
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === STORY LIKES ENDPOINTS ===

// Get like count for a story
app.get('/api/stories/:story_id/likes/count', async (req, res) => {
  try {
    const { story_id } = req.params;
    
    const { count, error } = await supabase
      .from('story_likes')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', parseInt(story_id));

    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Error getting like count:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's like status for a story
app.get('/api/stories/:story_id/likes/status', async (req, res) => {
  try {
    const { story_id } = req.params;
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.json({ isLiked: false });
    }

    const { data, error } = await supabase
      .from('story_likes')
      .select('*')
      .eq('story_id', parseInt(story_id))
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    
    res.json({ isLiked: !!data });
  } catch (error) {
    console.error('Error getting like status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle like for a story (POST to like, DELETE to unlike)
app.post('/api/stories/:story_id/likes', async (req, res) => {
  try {
    const { story_id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }

    const { data, error } = await supabase
      .from('story_likes')
      .insert({
        story_id: parseInt(story_id),
        user_id: user_id
      });

    if (error) throw error;
    res.json({ message: 'Story liked successfully' });
  } catch (error) {
    console.error('Error liking story:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/stories/:story_id/likes', async (req, res) => {
  try {
    const { story_id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }

    const { error } = await supabase
      .from('story_likes')
      .delete()
      .eq('story_id', parseInt(story_id))
      .eq('user_id', user_id);

    if (error) throw error;
    res.json({ message: 'Story unliked successfully' });
  } catch (error) {
    console.error('Error unliking story:', error);
    res.status(500).json({ error: error.message });
  }
});

// === USER PROFILE ENDPOINTS ===

// Get user by ID with complete profile data
app.get('/api/users/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Get user base info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, user_type, display_name, phone_number, avatar, created_at, updated_at')
      .eq('id', user_id)
      .single();
    
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get profile image from profile-photo bucket (if exists)
    let avatar = null;
    try {
      const { data: mediaData, error: mediaError } = await supabase
        .storage
        .from('profile-photo')
        .list(user_id + '/', { limit: 1, offset: 0 });
      
      if (mediaData && mediaData.length > 0) {
        // Get the first file in the user's folder
        const fileName = mediaData[0].name;
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('profile-photo')
          .createSignedUrl(user_id + '/' + fileName, 60 * 60 * 24);
        
        if (!signedUrlError && signedUrlData) {
          avatar = signedUrlData.signedUrl;
        }
      }
    } catch (mediaErr) {
      // No avatar, that's fine
      console.log('No avatar found for user:', user_id);
    }

    // Get type-specific profile data
    let profileData = {};
    if (user.user_type === 'athlete') {
      const { data: athleteData } = await supabase
        .from('athletes')
        .select('*')
        .eq('user_id', user_id)
        .single();
      if (athleteData) profileData = athleteData;
    } else if (user.user_type === 'coach') {
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user_id)
        .single();
      if (coachData) profileData = coachData;
    } else if (user.user_type === 'fan') {
      const { data: fanData } = await supabase
        .from('fans')
        .select('*')
        .eq('user_id', user_id)
        .single();
      if (fanData) profileData = fanData;
    }

    // Combine all data
    const completeProfile = {
      ...user,
      ...profileData,
      avatar: avatar
    };

    res.json(completeProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's saved posts
app.get('/api/users/:user_id/saved-posts', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { data, error } = await supabase
      .from('post_saves')
      .select(`
        *,
        posts!inner(
          *,
          users!inner(id, display_name, email)
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's media (profile images, etc.)
app.get('/api/users/:user_id/media', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { media_type } = req.query;
    
    let query = supabase
      .from('user_media')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);
    
    if (media_type) {
      query = query.eq('media_type', media_type);
    }
    
    const { data, error } = await query.order('uploaded_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 