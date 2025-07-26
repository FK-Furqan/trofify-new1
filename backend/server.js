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
    const { user_id, media_url, media_type, description, images } = req.body;
    let insertData = {
      user_id,
      description
    };
    if (Array.isArray(images) && images.length > 0) {
      insertData.images = images;
    } else {
      insertData.media_url = media_url;
      insertData.media_type = media_type;
    }
    const { data, error } = await supabase.from('posts').insert(insertData).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all posts with user info and like status for a user
app.get('/api/posts', async (req, res) => {
  try {
    const userId = req.query.user_id;
    // First get posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    // Then get user info and like status for each post
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
            users: { display_name: 'Unknown User', email: 'unknown@example.com', avatar: '/placeholder.svg', user_type: 'athlete' },
            isLiked: false
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

        // Get counts for likes, comments, shares, and saves
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { count: commentsCount } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { count: sharesCount } = await supabase
          .from('post_shares')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Check if the current user has liked this post
        let isLiked = false;
        let isSaved = false;
        if (userId) {
          // Check like status
          const { data: likeData, error: likeError } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', userId)
            .single();
          isLiked = !!likeData;

          // Check save status
          const { data: saveData, error: saveError } = await supabase
            .from('post_saves')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', userId)
            .single();
          isSaved = !!saveData;
        }

        return {
          ...post,
          users: {
            ...user,
            sport: sport
          },
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          shares_count: sharesCount || 0,
          isLiked,
          isSaved
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
    const currentUserId = req.query.current_user_id; // Get current user ID from query
    
    // First get posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    // Then get user info and like/save status for each post
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
            users: { display_name: 'Unknown User', email: 'unknown@example.com', avatar: '/placeholder.svg', user_type: 'athlete' },
            isLiked: false,
            isSaved: false
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

        // Get counts for likes, comments, shares
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { count: commentsCount } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { count: sharesCount } = await supabase
          .from('post_shares')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Check if the current user has liked this post
        let isLiked = false;
        let isSaved = false;
        if (currentUserId) {
          const { data: likeData } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', currentUserId)
            .single();

          const { data: saveData } = await supabase
            .from('post_saves')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', currentUserId)
            .single();

          isLiked = !!likeData;
          isSaved = !!saveData;
        }

        return {
          ...post,
          users: {
            ...user,
            sport: sport
          },
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0,
          shares_count: sharesCount || 0,
          isLiked,
          isSaved
        };
      })
    );

    res.json(postsWithUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like a post
app.post('/api/posts/:post_id/like', async (req, res) => {
  try {
    const { post_id } = req.params;
    const { user_id } = req.body;

    // Get post owner information
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', parseInt(post_id))
      .single();

    if (postError) throw postError;

    // Don't create notification if user is liking their own post
    if (postData.user_id === user_id) {
    const { data, error } = await supabase.from('post_likes').insert({
      user_id,
      post_id: parseInt(post_id)
    });

    if (error) throw error;
      return res.json({ message: 'Post liked successfully' });
    }

    // Get actor (liker) information
    const { data: actorData, error: actorError } = await supabase
      .from('users')
      .select('id, display_name, email, avatar, user_type')
      .eq('id', user_id)
      .single();

    if (actorError) throw actorError;

    // Insert like
    const { data, error } = await supabase.from('post_likes').insert({
      user_id,
      post_id: parseInt(post_id)
    });

    if (error) throw error;

    // Create notification
    const notificationMessage = `${actorData.display_name || actorData.email} liked your post`;
    
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: postData.user_id, // Post owner
      actor_id: user_id, // User who liked
      post_id: parseInt(post_id),
      type: 'like',
      message: notificationMessage,
      is_read: false
    });

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the like operation if notification fails
    }

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

    // Get post owner information
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', parseInt(post_id))
      .single();

    if (postError) throw postError;

    // Get actor (commenter) information
    const { data: actorData, error: actorError } = await supabase
      .from('users')
      .select('id, display_name, email, avatar, user_type')
      .eq('id', user_id)
      .single();

    if (actorError) throw actorError;

    // Insert comment
    const { data, error } = await supabase.from('post_comments').insert({
      user_id,
      post_id: parseInt(post_id),
      comment
    }).select().single();

    if (error) throw error;

    // Don't create notification if user is commenting on their own post
    if (postData.user_id !== user_id) {
      // Create notification
      const notificationMessage = `${actorData.display_name || actorData.email} commented: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`;
      
      const { error: notificationError } = await supabase.from('notifications').insert({
        user_id: postData.user_id, // Post owner
        actor_id: user_id, // User who commented
        post_id: parseInt(post_id),
        type: 'comment',
        message: notificationMessage,
        is_read: false
      });

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the comment operation if notification fails
      }
    }

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
        users!inner(id, display_name, email, avatar)
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
      .select(`
        user_id, 
        comment,
        users!inner(id, display_name, email, avatar)
      `)
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
    const { data: saves, error: savesError } = await supabase
      .from('post_saves')
      .select('*, posts!inner(*)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (savesError) throw savesError;

    // For each saved post, fetch user info and enrich the post object
    const enrichedPosts = await Promise.all(
      (saves || []).map(async (save) => {
        const post = save.posts;
        if (!post) return null;
        // Fetch user info
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, display_name, email, user_type, avatar')
          .eq('id', post.user_id)
          .single();
        let avatar = user?.avatar || '/placeholder.svg';
        // Ensure avatar is a full URL if not already
        if (avatar && !avatar.startsWith('http')) {
          avatar = `https://trofify-media.s3.amazonaws.com/${avatar}`;
        }
        // Optionally, fetch sport info
        let sport = null;
        if (user && user.user_type === 'athlete') {
          const { data: athleteData } = await supabase
            .from('athletes')
            .select('sport')
            .eq('user_id', user.id)
            .single();
          sport = athleteData?.sport;
        } else if (user && user.user_type === 'coach') {
          const { data: coachData } = await supabase
            .from('coaches')
            .select('sport')
            .eq('user_id', user.id)
            .single();
          sport = coachData?.sport;
        }
        // Get counts for likes, comments, shares
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { count: commentsCount } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        const { count: sharesCount } = await supabase
          .from('post_shares')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Check if the current user has liked this post
        const { data: likeData } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user_id)
          .single();

        // Parse images array if present
        let images = [];
        if (post.images) {
          if (Array.isArray(post.images)) {
            images = post.images;
          } else if (typeof post.images === 'string') {
            try {
              images = JSON.parse(post.images);
            } catch {}
          }
        }
        
        // Ensure media_url is a full URL if present
        let mediaUrl = post.media_url || '';
        if (mediaUrl && !mediaUrl.startsWith('http')) {
          mediaUrl = `https://trofify-media.s3.amazonaws.com/${mediaUrl}`;
        }
        
        // Ensure images are full URLs
        const fullUrlImages = images.map(img => {
          if (img && !img.startsWith('http')) {
            return `https://trofify-media.s3.amazonaws.com/${img}`;
          }
          return img;
        });

        return {
          id: post.id,
          user_id: post.user_id,
          author_name: user?.display_name || user?.email || 'Unknown',
          email: user?.email,
          avatar,
          user_type: user?.user_type,
          sport,
          description: post.description,
          content: post.content,
          image: mediaUrl,
          media_url: mediaUrl,
          images: fullUrlImages,
          created_at: post.created_at,
          likes: likesCount || 0,
          comments: commentsCount || 0,
          shares: sharesCount || 0,
          category: sport || user?.user_type,
          isLiked: !!likeData,
          isSaved: true, // These are saved posts, so always true
        };
      })
    );
    res.json(enrichedPosts.filter(Boolean));
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

// Search users
app.get('/api/users/search', async (req, res) => {
  try {
    const { q, current_user_id } = req.query;
    
    if (!q || !current_user_id) {
      return res.status(400).json({ error: 'Search query and current user ID are required' });
    }

    // Search users by display name or email, excluding the current user
    const { data, error } = await supabase
      .from('users')
      .select('id, display_name, email, avatar, user_type')
      .or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
      .neq('id', current_user_id)
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === NOTIFICATION ENDPOINTS ===

// Get notifications for a user
app.get('/api/notifications/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { limit = 30, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:users!notifications_actor_id_fkey(id, display_name, email, avatar, user_type),
        post:posts!notifications_post_id_fkey(
          id, 
          description, 
          images, 
          media_url, 
          media_type, 
          created_at,
          user_id
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    // Fetch post owner information for each notification
    const notificationsWithPostOwner = await Promise.all(
      data.map(async (notification) => {
        if (notification.post && notification.post.user_id) {
          const { data: postOwner, error: ownerError } = await supabase
            .from('users')
            .select('id, display_name, email, avatar, user_type')
            .eq('id', notification.post.user_id)
            .single();

          if (!ownerError && postOwner) {
            return {
              ...notification,
              post: {
                ...notification.post,
                author_name: postOwner.display_name,
                author_email: postOwner.email,
                avatar: postOwner.avatar,
                user_type: postOwner.user_type,
                category: postOwner.user_type
              }
            };
          }
        }
        return notification;
      })
    );

    res.json(notificationsWithPostOwner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread notification count
app.get('/api/notifications/:user_id/unread-count', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:notification_id/read', async (req, res) => {
  try {
    const { notification_id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', parseInt(notification_id));

    if (error) throw error;
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read for a user
app.put('/api/notifications/:user_id/read-all', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user_id)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a notification
app.delete('/api/notifications/:notification_id', async (req, res) => {
  try {
    const { notification_id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', parseInt(notification_id));

    if (error) throw error;
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== MESSAGING SYSTEM ENDPOINTS =====

// Get or create conversation between two users
app.post('/api/conversations', async (req, res) => {
  try {
    const { user1_id, user2_id } = req.body;
    
    console.log('Creating conversation between users:', { user1_id, user2_id });
    
    if (!user1_id || !user2_id) {
      return res.status(400).json({ error: 'Both user IDs are required' });
    }

    // Use the database function to get or create conversation
    console.log('Calling get_or_create_conversation function...');
    const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
      user1_uuid: user1_id,
      user2_uuid: user2_id
    });

    console.log('Function result:', { conversationId, error });

    if (error) {
      console.error('Database function error:', error);
      throw error;
    }

    // Get the conversation details
    console.log('Fetching conversation details for ID:', conversationId);
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    console.log('Conversation details:', { conversation, convError });

    if (convError) throw convError;

    res.json(conversation);
  } catch (error) {
    console.error('Error in conversation creation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's conversations
app.get('/api/users/:user_id/conversations', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Get conversations where user is either user1 or user2
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:users!conversations_user1_id_fkey(id, display_name, email, avatar, user_type),
        user2:users!conversations_user2_id_fkey(id, display_name, email, avatar, user_type)
      `)
      .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Transform conversations to include the other user's info and additional data
    const transformedConversations = await Promise.all(conversations.map(async (conv) => {
      const otherUser = conv.user1_id === user_id ? conv.user2 : conv.user1;
      
      // Get unread message count for this user
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('receiver_id', user_id)
        .eq('is_read', false);
      
      // Get the last message content
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return {
        id: conv.id,
        other_user: otherUser,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message_at: conv.last_message_at,
        unread_count: unreadCount > 0 ? unreadCount : null,
        last_message: lastMessage?.content || null
      };
    }));

    res.json(transformedConversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a conversation
app.get('/api/conversations/:conversation_id/messages', async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const offset = (page - 1) * limit;

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, display_name, email, avatar, user_type),
        receiver:users!messages_receiver_id_fkey(id, display_name, email, avatar, user_type)
      `)
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Reverse the order to show oldest first
    const reversedMessages = messages.reverse();

    res.json(reversedMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
app.post('/api/conversations/:conversation_id/messages', async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { sender_id, receiver_id, content } = req.body;

    console.log('Sending message:', { conversation_id, sender_id, receiver_id, content });

    if (!sender_id || !receiver_id || !content) {
      return res.status(400).json({ error: 'Sender ID, receiver ID, and content are required' });
    }

    // First, verify the conversation exists
    console.log('Verifying conversation exists...');
    const { data: existingConversation, error: convCheckError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversation_id)
      .single();

    console.log('Conversation check:', { existingConversation, convCheckError });

    if (convCheckError || !existingConversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id,
        receiver_id,
        content: content.trim()
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, display_name, email, avatar, user_type),
        receiver:users!messages_receiver_id_fkey(id, display_name, email, avatar, user_type)
      `)
      .single();

    console.log('Message insert result:', { message, error });

    if (error) throw error;

    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
app.put('/api/conversations/:conversation_id/messages/read', async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { user_id } = req.body;

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation_id)
      .eq('receiver_id', user_id)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread message count for a user
app.get('/api/users/:user_id/unread-messages', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user_id)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ count: count || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update typing status
app.put('/api/conversations/:conversation_id/typing', async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { user_id, is_typing } = req.body;

    const { data, error } = await supabase
      .from('typing_status')
      .upsert({
        conversation_id,
        user_id,
        is_typing,
        last_typing_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get typing status for a conversation
app.get('/api/conversations/:conversation_id/typing', async (req, res) => {
  try {
    const { conversation_id } = req.params;

    const { data, error } = await supabase
      .from('typing_status')
      .select('*')
      .eq('conversation_id', conversation_id)
      .eq('is_typing', true);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 