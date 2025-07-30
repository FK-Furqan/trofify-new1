const express = require('express');
const cors = require('cors');
const signupRoute = require('./signup');
require('dotenv').config();
const supabase = require('./db');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'https://www.trofify.com',
      'https://trofify.com',
      'http://localhost:8080',
      'http://localhost:8081'
    ],
    credentials: true
  }
});

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

// Track online users globally (outside connection handler)
const onlineUsers = new Map();

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Store user's online status
  let currentUserId = null;

  // Handle user registration/connection
  socket.on('register', (data) => {
    const userId = typeof data === 'string' ? data : data?.userId;
    if (userId) {
      currentUserId = userId;
      socket.userId = userId; // Store userId on socket for status checks
      
      // Add user to online users map
      onlineUsers.set(userId, socket.id);
      
      // Update user's online status
      socket.broadcast.emit('user_status', {
        userId: userId,
        status: 'online'
      });
      
      // When user connects, mark all pending messages as delivered
      markPendingMessagesAsDelivered(userId);
      
      console.log(`User ${userId} registered and connected. Online users:`, Array.from(onlineUsers.keys()));
    }
  });

  // Join notification room for a user
  socket.on('join_notifications', (data) => {
    const { userId } = data;
    if (userId) {
      socket.join(`notifications_${userId}`);
      console.log(`User ${userId} joined notifications room`);
    }
  });

  // Join conversation room for real-time messaging
  socket.on('join_conversation', (data) => {
    const { conversationId, userId } = data;
    if (conversationId && userId) {
      socket.join(`conversation_${conversationId}`);
      currentUserId = userId;
      
      // Update user's online status
      socket.broadcast.emit('user_status', {
        userId: userId,
        status: 'online'
      });
      
      // When user comes online, mark all pending messages as delivered
      markPendingMessagesAsDelivered(userId);
      
      console.log(`User ${userId} joined conversation ${conversationId}`);
    }
  });

  // Function to mark pending messages as delivered when user comes online
  const markPendingMessagesAsDelivered = async (userId) => {
    try {
      // Get all conversations where this user is the receiver
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (convError) {
        console.error('Error fetching conversations for delivery:', convError);
        return;
      }

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        
        // Find all sent messages that need to be marked as delivered
        const { data: pendingMessages, error: msgError } = await supabase
          .from('messages')
          .select('id, conversation_id, sender_id')
          .in('conversation_id', conversationIds)
          .eq('receiver_id', userId)
          .eq('delivery_status', 'sent');

        if (msgError) {
          console.error('Error fetching pending messages:', msgError);
          return;
        }

        // Mark each pending message as delivered
        for (const message of pendingMessages || []) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ delivery_status: 'delivered' })
            .eq('id', message.id);

          if (!updateError) {
            // Emit delivery status update to the conversation
            io.to(`conversation_${message.conversation_id}`).emit('message_delivered', {
              message_id: message.id,
              conversation_id: message.conversation_id
            });
            
            console.log(`Message ${message.id} marked as delivered for user ${userId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error marking pending messages as delivered:', error);
    }
  };

  // Leave conversation room
  socket.on('leave_conversation', (data) => {
    const { conversationId, userId } = data;
    if (conversationId && userId) {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    }
  });

  // Handle typing status
  socket.on('typing_status', (data) => {
    const { conversationId, userId, isTyping } = data;
    if (conversationId && userId) {
      // Broadcast typing status to all users in the conversation except the sender
      socket.to(`conversation_${conversationId}`).emit('typing_status', {
        conversationId: conversationId,
        userId: userId,
        isTyping: isTyping
      });
      
      console.log(`User ${userId} ${isTyping ? 'started' : 'stopped'} typing in conversation ${conversationId}`);
    }
  });

  // Handle message delivered status
  socket.on('message_delivered', async (data) => {
    const { messageId, receiverId } = data;
    if (messageId && receiverId) {
      try {
        const { data: message, error } = await supabase
          .from('messages')
          .update({ delivery_status: 'delivered' })
          .eq('id', messageId)
          .eq('receiver_id', receiverId)
          .select('conversation_id')
          .single();

        if (!error && message) {
          // Broadcast delivery status to all users in the conversation
          io.to(`conversation_${message.conversation_id}`).emit('message_delivered', {
            message_id: messageId,
            conversation_id: message.conversation_id
          });
          
          console.log(`Message ${messageId} marked as delivered`);
        }
      } catch (error) {
        console.error('Error marking message as delivered:', error);
      }
    }
  });

  // Handle message read status
  socket.on('message_read', async (data) => {
    const { messageId, receiverId } = data;
    if (messageId && receiverId) {
      try {
        const { data: message, error } = await supabase
          .from('messages')
          .update({ 
            is_read: true,
            delivery_status: 'read'
          })
          .eq('id', messageId)
          .eq('receiver_id', receiverId)
          .select('conversation_id')
          .single();

        if (!error && message) {
          // Broadcast read status to all users in the conversation
          io.to(`conversation_${message.conversation_id}`).emit('message_read', {
            message_id: messageId,
            conversation_id: message.conversation_id
          });
          
          console.log(`Message ${messageId} marked as read`);
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  });

  // Get user status
  socket.on('get_user_status', (data) => {
    const { userId } = data;
    if (userId) {
      // Check if user is online using the online users map
      const isOnline = onlineUsers.has(userId);
      
      socket.emit('user_status', {
        userId: userId,
        status: isOnline ? 'online' : 'offline'
      });
      
      console.log(`User ${userId} status check: ${isOnline ? 'online' : 'offline'}`);
    }
  });

  // Handle unread count request
  socket.on('get_unread_count', async (data) => {
    const { userId } = data;
    if (userId) {
      try {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false);
        
        socket.emit('unread_count_update', { userId, count: count || 0 });
      } catch (error) {
        console.error('Error getting unread count:', error);
        socket.emit('unread_count_update', { userId, count: 0 });
      }
    }
  });

  // Handle mark notification as read
  socket.on('mark_notification_read', async (data) => {
    const { notificationId } = data;
    if (notificationId) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
        
        if (!error) {
          // Get the notification to find the user_id
          const { data: notification } = await supabase
            .from('notifications')
            .select('user_id')
            .eq('id', notificationId)
            .single();
          
          if (notification) {
            // Update unread count for the user
            const { count } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', notification.user_id)
              .eq('is_read', false);
            
            io.to(`notifications_${notification.user_id}`).emit('unread_count_update', {
              userId: notification.user_id,
              count: count || 0
            });
          }
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  });

  // Handle mark all notifications as read
  socket.on('mark_all_notifications_read', async (data) => {
    const { userId } = data;
    if (userId) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId);
        
        if (!error) {
          io.to(`notifications_${userId}`).emit('unread_count_update', {
            userId,
            count: 0
          });
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Update user's offline status
    if (currentUserId) {
      // Remove user from online users map
      onlineUsers.delete(currentUserId);
      
      socket.broadcast.emit('user_status', {
        userId: currentUserId,
        status: 'offline'
      });
      
      console.log(`User ${currentUserId} went offline. Online users:`, Array.from(onlineUsers.keys()));
    }
  });
});

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

// Debug endpoint to check online users
app.get('/api/debug/online-users', (req, res) => {
  try {
    const onlineUserIds = Array.from(onlineUsers.keys());
    res.json({ 
      onlineUsers: onlineUserIds,
      count: onlineUserIds.length
    });
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

    // First, get the current user to check if they have an existing avatar
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('avatar')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching current user:', userError);
    }

    const fileName = `${userId}/${Date.now()}-${req.file.originalname}`;
    
    // Upload to Supabase Storage
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

    // Update user avatar in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    // If user had a previous avatar, try to delete it from storage
    if (currentUser && currentUser.avatar) {
      try {
        // Extract the file path from the old avatar URL
        const oldAvatarUrl = currentUser.avatar;
        if (oldAvatarUrl.includes('profile-photo')) {
          // Extract the file path from the URL
          const urlParts = oldAvatarUrl.split('/');
          const filePath = urlParts.slice(urlParts.indexOf('profile-photo') + 1).join('/');
          
          // Delete the old file
          await supabase.storage
            .from('profile-photo')
            .remove([filePath]);
          
          console.log('Old profile image deleted:', filePath);
        }
      } catch (deleteError) {
        console.error('Error deleting old profile image:', deleteError);
        // Don't fail the upload if deletion fails
      }
    }

    // Also update user_media table to track the new profile image
    try {
      await supabase.from('user_media').insert({
        user_id: userId,
        media_url: publicUrl,
        media_type: 'profile_image',
        is_active: true
      });
    } catch (mediaError) {
      console.error('Error updating user_media table:', mediaError);
      // Don't fail the upload if media tracking fails
    }

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
    const { user_id, media_url, media_type, description, images, media_types, taggedUsers } = req.body;
    
    // Validate user_id
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Handle temporary user IDs for development/testing
    let actualUserId = user_id;
    if (user_id.startsWith('temp-')) {
      // For temporary IDs, try to find a default user or create one
      const { data: defaultUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .single();
      
      if (userError || !defaultUser) {
        return res.status(400).json({ error: 'No valid user found. Please sign up first.' });
      }
      
      actualUserId = defaultUser.id;
      console.log(`Using default user ID ${actualUserId} for temporary ID ${user_id}`);
    } else {
      // Validate UUID format for real user IDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user_id)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }
    }
    let insertData = {
      user_id: actualUserId,
      description,
      created_at: new Date().toISOString() // Explicitly set the current timestamp in UTC
    };
    if (Array.isArray(images) && images.length > 0) {
      insertData.images = images;
      // Store media types as metadata in the images array
      if (Array.isArray(media_types) && media_types.length === images.length) {
        const imagesWithTypes = images.map((url, index) => ({
          url: url,
          type: media_types[index] || 'image'
        }));
        insertData.images = imagesWithTypes;
      }
    } else {
      insertData.media_url = media_url;
      insertData.media_type = media_type;
    }
    
    // Create the post
    const { data: post, error } = await supabase.from('posts').insert(insertData).select().single();
    if (error) throw error;

    // Handle user tagging if provided
    if (taggedUsers && Array.isArray(taggedUsers) && taggedUsers.length > 0) {
      // Extract user IDs from tagged users
      const taggedUserIds = taggedUsers.map(user => user.id);
      
      // Create post tags
      const postTags = taggedUserIds.map(taggedUserId => ({
        post_id: post.id,
        tagged_user_id: taggedUserId,
        tagged_by: actualUserId
      }));

      const { error: tagError } = await supabase
        .from('post_tags')
        .insert(postTags);

      if (tagError) {
        console.error('Error creating post tags:', tagError);
      } else {
        // Create notifications for tagged users
        await createTagNotifications(post.id, taggedUserIds, actualUserId);
      }
    }

    res.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    console.error('Request body:', req.body);
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

        // Get tagged users for this post
        const { data: taggedUsersData, error: taggedError } = await supabase
          .from('post_tags')
          .select(`
            tagged_user:users!post_tags_tagged_user_id_fkey(
              id, display_name, email, avatar, user_type
            )
          `)
          .eq('post_id', post.id);

        const taggedUsers = taggedError ? [] : 
          taggedUsersData.map(item => item.tagged_user).filter(Boolean);

        return {
          ...post,
          users: {
            ...user,
            sport: sport
          },
          tagged_users: taggedUsers,
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

// Get recent posts from users that the current user supports
app.get('/api/posts/recent', async (req, res) => {
  try {
    const currentUserId = req.query.user_id;
    const limit = parseInt(req.query.limit) || 3;
    
    if (!currentUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Calculate the date 24 hours ago
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    // First, get the list of users that the current user supports
    const { data: supportedUsers, error: supportsError } = await supabase
      .from('supports')
      .select('supported_id')
      .eq('supporter_id', currentUserId);

    if (supportsError) throw supportsError;

    // If user doesn't support anyone, return empty array
    if (!supportedUsers || supportedUsers.length === 0) {
      return res.json([]);
    }

    // Extract the supported user IDs
    const supportedUserIds = supportedUsers.map(support => support.supported_id);

    // Get recent posts from supported users (only from the last 24 hours)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', supportedUserIds)
      .gte('created_at', oneDayAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (postsError) throw postsError;

    // If no posts found, return empty array
    if (!posts || posts.length === 0) {
      return res.json([]);
    }

    // Get user info and supporter count for each post
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
            author: { display_name: 'Unknown User', email: 'unknown@example.com', avatar: '/placeholder.svg', user_type: 'athlete' },
            supporter_count: 0
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

        // Get supporter count for the post author
        const { count: supporterCount } = await supabase
          .from('supports')
          .select('*', { count: 'exact', head: true })
          .eq('supported_id', post.user_id);

        return {
          ...post,
          author: {
            ...user,
            sport: sport
          },
          supporter_count: supporterCount || 0
        };
      })
    );

    // Debug: Log the results
    console.log('Recent posts API called with user_id:', currentUserId);
    console.log('Supported user IDs:', supportedUserIds);
    console.log('Posts found:', posts.length);
    console.log('Posts with users:', postsWithUsers.length);

    res.json(postsWithUsers);
  } catch (error) {
    console.error('Recent posts fetch error:', error);
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
    
    const { data: notificationData, error: notificationError } = await supabase.from('notifications').insert({
      user_id: postData.user_id, // Post owner
      actor_id: user_id, // User who liked
      post_id: parseInt(post_id),
      type: 'like',
      message: notificationMessage,
      is_read: false
    }).select().single();

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the like operation if notification fails
    } else {
      // Emit real-time notification
      const notificationWithActor = {
        ...notificationData,
        actor: actorData
      };
      io.to(`notifications_${postData.user_id}`).emit('new_notification', notificationWithActor);
      
      // Update unread count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', postData.user_id)
        .eq('is_read', false);
      
      io.to(`notifications_${postData.user_id}`).emit('unread_count_update', {
        userId: postData.user_id,
        count: count || 0
      });
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
    const { user_id, comment, taggedUsers } = req.body;

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

    // Handle user tagging in comments if provided
    if (taggedUsers && Array.isArray(taggedUsers) && taggedUsers.length > 0) {
      // Extract user IDs from tagged users
      const taggedUserIds = taggedUsers.map(user => user.id);
      
      // Create comment tags
      const commentTags = taggedUserIds.map(taggedUserId => ({
        comment_id: data.id,
        tagged_user_id: taggedUserId,
        tagged_by: user_id
      }));

      const { error: tagError } = await supabase
        .from('comment_tags')
        .insert(commentTags);

      if (tagError) {
        console.error('Error creating comment tags:', tagError);
      } else {
        // Create notifications for tagged users in comments
        await createTagNotifications(parseInt(post_id), taggedUserIds, user_id);
      }
    }

    // Don't create notification if user is commenting on their own post
    if (postData.user_id !== user_id) {
      // Create notification
      const notificationMessage = `${actorData.display_name || actorData.email} commented: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`;
      
      const { data: notificationData, error: notificationError } = await supabase.from('notifications').insert({
        user_id: postData.user_id, // Post owner
        actor_id: user_id, // User who commented
        post_id: parseInt(post_id),
        type: 'comment',
        message: notificationMessage,
        is_read: false
      }).select().single();

      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't fail the comment operation if notification fails
      } else {
        // Emit real-time notification
        const notificationWithActor = {
          ...notificationData,
          actor: actorData
        };
        io.to(`notifications_${postData.user_id}`).emit('new_notification', notificationWithActor);
        
        // Update unread count
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', postData.user_id)
          .eq('is_read', false);
        
        io.to(`notifications_${postData.user_id}`).emit('unread_count_update', {
          userId: postData.user_id,
          count: count || 0
        });
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

    // Get tagged users for each comment
    const commentsWithTags = await Promise.all(
      data.map(async (comment) => {
        const { data: taggedUsersData, error: taggedError } = await supabase
          .from('comment_tags')
          .select(`
            tagged_user:users!comment_tags_tagged_user_id_fkey(
              id, display_name, email, avatar, user_type
            )
          `)
          .eq('comment_id', comment.id);

        const taggedUsers = taggedError ? [] : 
          taggedUsersData.map(item => item.tagged_user).filter(Boolean);

        return {
          ...comment,
          tagged_users: taggedUsers
        };
      })
    );

    res.json(commentsWithTags);
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

// Delete a post
app.delete('/api/posts/:post_id', async (req, res) => {
  try {
    const { post_id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // First, check if the post exists and belongs to the user
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', parseInt(post_id))
      .single();

    if (postError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    // Delete related data first (due to foreign key constraints)
    // Delete post tags
    await supabase
      .from('post_tags')
      .delete()
      .eq('post_id', parseInt(post_id));

    // Delete comment tags
    await supabase
      .from('comment_tags')
      .delete()
      .eq('comment_id', (await supabase
        .from('post_comments')
        .select('id')
        .eq('post_id', parseInt(post_id))).data?.map(c => c.id) || []);

    // Delete comments
    await supabase
      .from('post_comments')
      .delete()
      .eq('post_id', parseInt(post_id));

    // Delete likes
    await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', parseInt(post_id));

    // Delete saves
    await supabase
      .from('post_saves')
      .delete()
      .eq('post_id', parseInt(post_id));

    // Delete shares
    await supabase
      .from('post_shares')
      .delete()
      .eq('post_id', parseInt(post_id));

    // Finally, delete the post itself
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', parseInt(post_id));

    if (deleteError) throw deleteError;

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
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
    const { viewer_id } = req.query; // Optional: current user's ID to check viewed status
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // First get stories
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (storiesError) throw storiesError;

    // Get viewed stories for the current user if viewer_id is provided
    let viewedStoryIds = [];
    if (viewer_id) {
      const { data: viewedStories, error: viewedError } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_id', viewer_id);
      
      if (!viewedError && viewedStories) {
        viewedStoryIds = viewedStories.map(view => view.story_id);
      }
    }

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
          users: user || { display_name: 'Unknown User', email: 'unknown@example.com' },
          viewed: viewedStoryIds.includes(story.id)
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

// === STORY VIEWS ENDPOINTS ===

// Mark a story as viewed by a user
app.post('/api/stories/:story_id/view', async (req, res) => {
  try {
    const { story_id } = req.params;
    const { viewer_id } = req.body;
    
    if (!viewer_id) {
      return res.status(400).json({ error: 'viewer_id required' });
    }

    // Insert view record (UNIQUE constraint will prevent duplicates)
    const { data, error } = await supabase
      .from('story_views')
      .insert({
        story_id: parseInt(story_id),
        viewer_id: viewer_id
      });

    if (error) {
      // If it's a duplicate key error, that's fine - story was already viewed
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        return res.json({ message: 'Story already viewed' });
      }
      throw error;
    }
    
    res.json({ message: 'Story marked as viewed' });
  } catch (error) {
    console.error('Error marking story as viewed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get viewed stories for a user
app.get('/api/stories/viewed/:viewer_id', async (req, res) => {
  try {
    const { viewer_id } = req.params;
    
    const { data: viewedStories, error } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('viewer_id', viewer_id);

    if (error) throw error;
    
    const viewedStoryIds = viewedStories.map(view => view.story_id);
    res.json({ viewedStoryIds });
  } catch (error) {
    console.error('Error getting viewed stories:', error);
    res.status(500).json({ error: error.message });
  }
});

// === USER PROFILE ENDPOINTS ===

// Search users (must be before /:user_id route)
app.get('/api/users/search', async (req, res) => {
  try {
    const { q, current_user_id } = req.query;
    
    console.log('User search request:', { q, current_user_id });
    
    if (!current_user_id) {
      return res.status(400).json({ error: 'Current user ID is required' });
    }

    // Skip UUID validation for temporary IDs (for development/testing)
    if (current_user_id.startsWith('temp-')) {
      console.log('Skipping UUID validation for temporary user ID');
    } else {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(current_user_id)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }
    }

    let query = supabase
      .from('users')
      .select(`
        id, 
        display_name, 
        email, 
        avatar, 
        user_type,
        athletes!fk_athlete_user(sport),
        coaches!fk_coach_user(sport)
      `);

    // Only exclude current user if it's a valid UUID
    if (!current_user_id.startsWith('temp-')) {
      query = query.neq('id', current_user_id);
    }

    // If search query is provided, filter by it
    if (q && q.trim()) {
      query = query.or(`display_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`);
    }

    // Limit results and order by display name
    const { data, error } = await query
      .order('display_name', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Supabase search error:', error);
      throw error;
    }

    // Process sport information for each user
    const processedData = data?.map(user => {
      let sport = null;
      
      // Extract sport from athlete or coach data
      if (user.athletes && user.athletes.length > 0) {
        sport = user.athletes[0].sport;
      } else if (user.coaches && user.coaches.length > 0) {
        sport = user.coaches[0].sport;
      }
      
      return {
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        avatar: user.avatar,
        user_type: user.user_type,
        sport: sport
      };
    }) || [];

    console.log(`Found ${processedData.length} users for query: "${q}"`);
    res.json(processedData);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID with complete profile data
app.get('/api/users/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Get user base info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, user_type, display_name, phone_number, avatar, created_at')
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



// Get tagged users for a post
app.get('/api/posts/:post_id/tagged-users', async (req, res) => {
  try {
    const { post_id } = req.params;

    const { data, error } = await supabase
      .from('post_tags')
      .select(`
        tagged_user:users!post_tags_tagged_user_id_fkey(
          id, display_name, email, avatar, user_type
        )
      `)
      .eq('post_id', post_id);

    if (error) throw error;

    const taggedUsers = data.map(item => item.tagged_user).filter(Boolean);
    res.json(taggedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create tag notifications for tagged users
async function createTagNotifications(postId, taggedUserIds, taggedByUserId) {
  try {
    // Get the tagging user's info
    const { data: taggingUser, error: userError } = await supabase
      .from('users')
      .select('id, display_name, email, avatar')
      .eq('id', taggedByUserId)
      .single();

    if (userError || !taggingUser) {
      console.error('Error fetching tagging user:', userError);
      return;
    }

    // Create notifications for each tagged user
    const notifications = taggedUserIds.map(taggedUserId => ({
      user_id: taggedUserId,
      actor_id: taggedByUserId,
      post_id: postId,
      type: 'tag',
      message: `${taggingUser.display_name} tagged you in a post`,
      is_read: false
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notificationError) {
      console.error('Error creating tag notifications:', notificationError);
      return;
    }

    // Send real-time notifications via Socket.IO
    taggedUserIds.forEach(taggedUserId => {
      io.to(`notifications_${taggedUserId}`).emit('new_notification', {
        type: 'tag',
        message: `${taggingUser.display_name} tagged you in a post`,
        post_id: postId,
        actor: {
          id: taggingUser.id,
          display_name: taggingUser.display_name,
          avatar: taggingUser.avatar
        }
      });
    });

    console.log(`Created tag notifications for ${taggedUserIds.length} users`);
  } catch (error) {
    console.error('Error in createTagNotifications:', error);
  }
}

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
            // Get sport information for post owner
            let sport = null;
            if (postOwner.user_type === 'athlete') {
              const { data: athleteData } = await supabase
                .from('athletes')
                .select('sport')
                .eq('user_id', postOwner.id)
                .single();
              if (athleteData) sport = athleteData.sport;
            } else if (postOwner.user_type === 'coach') {
              const { data: coachData } = await supabase
                .from('coaches')
                .select('sport')
                .eq('user_id', postOwner.id)
                .single();
              if (coachData) sport = coachData.sport;
            }

            return {
              ...notification,
              post: {
                ...notification.post,
                author_name: postOwner.display_name,
                author_email: postOwner.email,
                avatar: postOwner.avatar,
                user_type: postOwner.user_type,
                category: postOwner.user_type,
                sport: sport
              }
            };
          }
        }
        
        // Also get sport information for the actor (notification creator)
        if (notification.actor) {
          let actorSport = null;
          if (notification.actor.user_type === 'athlete') {
            const { data: athleteData } = await supabase
              .from('athletes')
              .select('sport')
              .eq('user_id', notification.actor.id)
              .single();
            if (athleteData) actorSport = athleteData.sport;
          } else if (notification.actor.user_type === 'coach') {
            const { data: coachData } = await supabase
              .from('coaches')
              .select('sport')
              .eq('user_id', notification.actor.id)
              .single();
            if (coachData) actorSport = coachData.sport;
          }
          
          return {
            ...notification,
            actor: {
              ...notification.actor,
              sport: actorSport
            }
          };
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

    // Handle temporary user IDs
    if (user_id.startsWith('temp-')) {
      res.json({ count: 0 });
      return;
    }

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
      
      // Get sport information for the other user
      let sport = null;
      if (otherUser.user_type === 'athlete') {
        const { data: athleteData } = await supabase
          .from('athletes')
          .select('sport')
          .eq('user_id', otherUser.id)
          .single();
        if (athleteData) sport = athleteData.sport;
      } else if (otherUser.user_type === 'coach') {
        const { data: coachData } = await supabase
          .from('coaches')
          .select('sport')
          .eq('user_id', otherUser.id)
          .single();
        if (coachData) sport = coachData.sport;
      }
      
      // Add sport to otherUser
      const otherUserWithSport = {
        ...otherUser,
        sport: sport
      };
      
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
        .select('content, delivery_status, sender_id')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return {
        id: conv.id,
        other_user: otherUserWithSport,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message_at: conv.last_message_at,
        unread_count: unreadCount > 0 ? unreadCount : null,
        last_message: lastMessage?.content || null,
        last_message_delivery_status: lastMessage?.delivery_status || null,
        last_message_sender_id: lastMessage?.sender_id || null
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
        content: content.trim(),
        delivery_status: 'sent'
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, display_name, email, avatar, user_type),
        receiver:users!messages_receiver_id_fkey(id, display_name, email, avatar, user_type)
      `)
      .single();

    console.log('Message insert result:', { message, error });

    if (error) throw error;

    // Check if recipient is online and mark message as delivered immediately
    let finalMessage = message;
    if (onlineUsers.has(receiver_id)) {
      // Recipient is online, mark message as delivered
      const { data: updatedMessage, error: updateError } = await supabase
        .from('messages')
        .update({ delivery_status: 'delivered' })
        .eq('id', message.id)
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, display_name, email, avatar, user_type),
          receiver:users!messages_receiver_id_fkey(id, display_name, email, avatar, user_type)
        `)
        .single();

      if (!updateError && updatedMessage) {
        finalMessage = updatedMessage;
        console.log(`Message ${message.id} marked as delivered immediately (recipient online)`);
      }
    }

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation_id);

    // Emit real-time update to all users in the conversation
    io.to(`conversation_${conversation_id}`).emit('new_message', {
      conversation_id: conversation_id,
      message: finalMessage
    });

    // If message was marked as delivered, also emit delivery status update
    if (finalMessage.delivery_status === 'delivered') {
      io.to(`conversation_${conversation_id}`).emit('message_delivered', {
        message_id: finalMessage.id,
        conversation_id: conversation_id
      });
    }

    res.json(finalMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark message as delivered
app.put('/api/messages/:message_id/delivered', async (req, res) => {
  try {
    const { message_id } = req.params;
    const { receiver_id } = req.body;

    const { data: message, error } = await supabase
      .from('messages')
      .update({ delivery_status: 'delivered' })
      .eq('id', message_id)
      .eq('receiver_id', receiver_id)
      .select()
      .single();

    if (error) throw error;

    // Emit delivery status update
    io.to(`conversation_${message.conversation_id}`).emit('message_delivered', {
      message_id: message_id,
      conversation_id: message.conversation_id
    });

    res.json({ message: 'Message marked as delivered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
app.put('/api/conversations/:conversation_id/messages/read', async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { user_id } = req.body;

    const { data: messages, error } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        delivery_status: 'read'
      })
      .eq('conversation_id', conversation_id)
      .eq('receiver_id', user_id)
      .eq('is_read', false)
      .select('id, conversation_id');

    if (error) throw error;

    // Emit read status updates for each message
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        io.to(`conversation_${msg.conversation_id}`).emit('message_read', {
          message_id: msg.id,
          conversation_id: msg.conversation_id
        });
      });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread message count for a user
app.get('/api/users/:user_id/unread-messages', async (req, res) => {
  try {
    const { user_id } = req.params;

    // Handle temporary user IDs
    if (user_id.startsWith('temp-')) {
      res.json({ count: 0 });
      return;
    }

    // Count conversations that have unread messages for this user
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`);

    if (error) throw error;

    if (data.length === 0) {
      res.json({ count: 0 });
      return;
    }

    // Get conversation IDs for this user
    const conversationIds = data.map(c => c.id);

    // Count conversations that have unread messages
    const { count, error: countError } = await supabase
      .from('messages')
      .select('conversation_id', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .eq('receiver_id', user_id)
      .eq('is_read', false);

    if (countError) throw countError;

    // Get unique conversation IDs with unread messages
    const { data: unreadConversations, error: unreadError } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .eq('receiver_id', user_id)
      .eq('is_read', false);

    if (unreadError) throw unreadError;

    // Count unique conversations with unread messages
    const uniqueConversations = [...new Set(unreadConversations.map(m => m.conversation_id))];
    const conversationCount = uniqueConversations.length;

    res.json({ count: conversationCount });
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

// ==================== SUPPORT ENDPOINTS ====================

// Toggle support/un-support
app.post('/api/supports/toggle', async (req, res) => {
  try {
    const { supporter_id, supported_id } = req.body;

    if (!supporter_id || !supported_id) {
      return res.status(400).json({ error: 'supporter_id and supported_id are required' });
    }

    // Check if support already exists
    const { data: existingSupport, error: checkError } = await supabase
      .from('supports')
      .select('id')
      .eq('supporter_id', supporter_id)
      .eq('supported_id', supported_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingSupport) {
      // Remove support (un-support)
      const { error: deleteError } = await supabase
        .from('supports')
        .delete()
        .eq('supporter_id', supporter_id)
        .eq('supported_id', supported_id);

      if (deleteError) throw deleteError;

      // Get updated counts
      const [supporterCount, supportingCount] = await Promise.all([
        getSupporterCount(supported_id),
        getSupportingCount(supporter_id)
      ]);

      res.json({
        action: 'un_supported',
        supported_user_supporter_count: supporterCount,  // Count for the user being un-supported
        supporter_user_supporting_count: supportingCount  // Count for the user doing the un-support
      });
    } else {
      // Add support
      const { error: insertError } = await supabase
        .from('supports')
        .insert({
          supporter_id,
          supported_id,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Create notification
      const { data: supporterData } = await supabase
        .from('users')
        .select('display_name, avatar, user_type')
        .eq('id', supporter_id)
        .single();

      if (supporterData) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: supported_id,
            actor_id: supporter_id,
            type: 'support',
            message: `${supporterData.display_name || 'Someone'} has started supporting you`,
            is_read: false,
            created_at: new Date().toISOString()
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      // Get updated counts
      const [supporterCount, supportingCount] = await Promise.all([
        getSupporterCount(supported_id),
        getSupportingCount(supporter_id)
      ]);

      res.json({
        action: 'supported',
        supported_user_supporter_count: supporterCount,  // Count for the user being supported
        supporter_user_supporting_count: supportingCount,  // Count for the user doing the support
        notification_created: true
      });
    }
  } catch (error) {
    console.error('Error toggling support:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get supporter count for a user
app.get('/api/supports/supporter-count/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const count = await getSupporterCount(user_id);
    res.json({ count });
  } catch (error) {
    console.error('Error getting supporter count:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get supporting count for a user
app.get('/api/supports/supporting-count/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const count = await getSupportingCount(user_id);
    res.json({ count });
  } catch (error) {
    console.error('Error getting supporting count:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if user is supporting another user
app.post('/api/supports/check', async (req, res) => {
  try {
    const { supporter_id, supported_id } = req.body;

    if (!supporter_id || !supported_id) {
      return res.status(400).json({ error: 'supporter_id and supported_id are required' });
    }

    const { data, error } = await supabase
      .from('supports')
      .select('id')
      .eq('supporter_id', supporter_id)
      .eq('supported_id', supported_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({ is_supporting: !!data });
  } catch (error) {
    console.error('Error checking support status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get both supporter and supporting counts for a user
app.get('/api/supports/counts/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const [supporterCount, supportingCount] = await Promise.all([
      getSupporterCount(user_id),
      getSupportingCount(user_id)
    ]);

    res.json({
      supporter_count: supporterCount,
      supporting_count: supportingCount
    });
  } catch (error) {
    console.error('Error getting support counts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get list of users who support a specific user (supporters)
app.get('/api/supports/supporters/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: supports, error } = await supabase
      .from('supports')
      .select(`
        supporter_id,
        created_at,
        supporter:users!supports_supporter_id_fkey(
          id, display_name, email, avatar, user_type
        )
      `)
      .eq('supported_id', user_id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    // Enrich with sport information for athletes and coaches
    const enrichedSupporters = await Promise.all(
      supports.map(async (support) => {
        const supporter = support.supporter;
        if (!supporter) return null;

        let sport = null;
        if (supporter.user_type === 'athlete') {
          const { data: athleteData } = await supabase
            .from('athletes')
            .select('sport')
            .eq('user_id', supporter.id)
            .single();
          sport = athleteData?.sport;
        } else if (supporter.user_type === 'coach') {
          const { data: coachData } = await supabase
            .from('coaches')
            .select('sport')
            .eq('user_id', supporter.id)
            .single();
          sport = coachData?.sport;
        }

        return {
          id: supporter.id,
          name: supporter.display_name || supporter.email,
          username: supporter.email,
          avatar: supporter.avatar || '/placeholder.svg',
          sport: sport || supporter.user_type,
          user_type: supporter.user_type,
          supported_since: support.created_at,
          isConnected: false // You can implement connection logic here
        };
      })
    );

    res.json(enrichedSupporters.filter(Boolean));
  } catch (error) {
    console.error('Error getting supporters:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get list of users that a specific user supports (supporting)
app.get('/api/supports/supporting/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: supports, error } = await supabase
      .from('supports')
      .select(`
        supported_id,
        created_at,
        supported:users!supports_supported_id_fkey(
          id, display_name, email, avatar, user_type
        )
      `)
      .eq('supporter_id', user_id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    // Enrich with sport information for athletes and coaches
    const enrichedSupporting = await Promise.all(
      supports.map(async (support) => {
        const supported = support.supported;
        if (!supported) return null;

        let sport = null;
        if (supported.user_type === 'athlete') {
          const { data: athleteData } = await supabase
            .from('athletes')
            .select('sport')
            .eq('user_id', supported.id)
            .single();
          sport = athleteData?.sport;
        } else if (supported.user_type === 'coach') {
          const { data: coachData } = await supabase
            .from('coaches')
            .select('sport')
            .eq('user_id', supported.id)
            .single();
          sport = coachData?.sport;
        }

        return {
          id: supported.id,
          name: supported.display_name || supported.email,
          username: supported.email,
          avatar: supported.avatar || '/placeholder.svg',
          sport: sport || supported.user_type,
          user_type: supported.user_type,
          supported_since: support.created_at,
          isConnected: false // You can implement connection logic here
        };
      })
    );

    res.json(enrichedSupporting.filter(Boolean));
  } catch (error) {
    console.error('Error getting supporting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for support counts
async function getSupporterCount(userId) {
  const { count, error } = await supabase
    .from('supports')
    .select('*', { count: 'exact', head: true })
    .eq('supported_id', userId);

  if (error) throw error;
  return count || 0;
}

async function getSupportingCount(userId) {
  const { count, error } = await supabase
    .from('supports')
    .select('*', { count: 'exact', head: true })
    .eq('supporter_id', userId);

  if (error) throw error;
  return count || 0;
}

// ==================== REEL ENDPOINTS ====================

// Upload a new reel
app.post('/api/reels/upload', upload.single('video'), async (req, res) => {
  try {
    const { userId, caption, hashtags, audioAttribution, location } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Validate video file
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid video format. Please upload MP4, MOV, AVI, or QuickTime files.' });
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: 'Video file too large. Maximum size is 100MB.' });
    }

    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `reels/${userId}/${Date.now()}-${uuidv4()}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reels')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload video' });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('reels')
      .getPublicUrl(fileName);

    // Create thumbnail (you can implement thumbnail generation here)
    const thumbnailUrl = publicUrl; // For now, use video URL as thumbnail

    // Parse hashtags
    const hashtagsArray = hashtags ? hashtags.split(',').map(tag => tag.trim().replace('#', '')) : [];

    // Insert reel into database
    const { data: reel, error: insertError } = await supabase
      .from('reels')
      .insert({
        user_id: userId,
        video_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        caption: caption || null,
        duration: 0, // You can extract duration using FFmpeg
        audio_url: null,
        audio_attribution: audioAttribution || null,
        hashtags: hashtagsArray,
        location: location || null,
        is_public: true,
        view_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save reel' });
    }

    // Get user info for response
    const { data: user } = await supabase
      .from('users')
      .select('display_name, avatar, user_type')
      .eq('id', userId)
      .single();

    const reelWithUser = {
      ...reel,
      user: {
        id: userId,
        name: user?.display_name || 'Unknown User',
        avatar: user?.avatar || '/placeholder.svg',
        user_type: user?.user_type || 'user'
      }
    };

    res.json(reelWithUser);
  } catch (error) {
    console.error('Reel upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reels feed
app.get('/api/reels/feed', async (req, res) => {
  try {
    const { limit = 10, offset = 0, userId } = req.query;

    let query = supabase
      .from('reels')
      .select(`
        *,
        user:users!reels_user_id_fkey(
          id, display_name, avatar, user_type
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data: reels, error } = await query;

    if (error) throw error;

    // Enrich reels with like/comment counts and user interaction status
    const enrichedReels = await Promise.all(
      reels.map(async (reel) => {
        // Get like count
        const { count: likeCount } = await supabase
          .from('reel_likes')
          .select('*', { count: 'exact', head: true })
          .eq('reel_id', reel.id);

        // Get comment count
        const { count: commentCount } = await supabase
          .from('reel_comments')
          .select('*', { count: 'exact', head: true })
          .eq('reel_id', reel.id);

        // Check if current user has liked this reel
        let isLiked = false;
        if (userId) {
          const { data: likeData } = await supabase
            .from('reel_likes')
            .select('id')
            .eq('reel_id', reel.id)
            .eq('user_id', userId)
            .single();
          isLiked = !!likeData;
        }

        // Check if current user has saved this reel
        let isSaved = false;
        if (userId) {
          const { data: saveData } = await supabase
            .from('reel_saves')
            .select('id')
            .eq('reel_id', reel.id)
            .eq('user_id', userId)
            .single();
          isSaved = !!saveData;
        }

        return {
          ...reel,
          like_count: likeCount || 0,
          comment_count: commentCount || 0,
          is_liked: isLiked,
          is_saved: isSaved
        };
      })
    );

    res.json(enrichedReels);
  } catch (error) {
    console.error('Error fetching reels:', error);
    res.status(500).json({ error: error.message });
  }
});

// Like/unlike a reel
app.post('/api/reels/:reelId/like', async (req, res) => {
  try {
    const { reelId } = req.params;
    const { userId } = req.body;

    // Check if user already liked the reel
    const { data: existingLike } = await supabase
      .from('reel_likes')
      .select('id')
      .eq('reel_id', reelId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from('reel_likes')
        .delete()
        .eq('reel_id', reelId)
        .eq('user_id', userId);

      res.json({ liked: false });
    } else {
      // Like
      await supabase
        .from('reel_likes')
        .insert({
          reel_id: reelId,
          user_id: userId
        });

      // Create notification for reel owner
      const { data: reel } = await supabase
        .from('reels')
        .select('user_id')
        .eq('id', reelId)
        .single();

      if (reel && reel.user_id !== userId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: reel.user_id,
            actor_id: userId,
            type: 'like',
            message: 'liked your reel'
          });
      }

      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling reel like:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save/unsave a reel
app.post('/api/reels/:reelId/save', async (req, res) => {
  try {
    const { reelId } = req.params;
    const { userId } = req.body;

    // Check if user already saved the reel
    const { data: existingSave } = await supabase
      .from('reel_saves')
      .select('id')
      .eq('reel_id', reelId)
      .eq('user_id', userId)
      .single();

    if (existingSave) {
      // Unsave
      await supabase
        .from('reel_saves')
        .delete()
        .eq('reel_id', reelId)
        .eq('user_id', userId);

      res.json({ saved: false });
    } else {
      // Save
      await supabase
        .from('reel_saves')
        .insert({
          reel_id: reelId,
          user_id: userId
        });

      res.json({ saved: true });
    }
  } catch (error) {
    console.error('Error toggling reel save:', error);
    res.status(500).json({ error: error.message });
  }
});

// Share a reel
app.post('/api/reels/:reelId/share', async (req, res) => {
  try {
    const { reelId } = req.params;
    const { userId, sharedTo } = req.body;

    await supabase
      .from('reel_shares')
      .insert({
        reel_id: reelId,
        user_id: userId,
        shared_to: sharedTo || 'general'
      });

    res.json({ shared: true });
  } catch (error) {
    console.error('Error sharing reel:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reel comments
app.get('/api/reels/:reelId/comments', async (req, res) => {
  try {
    const { reelId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data: comments, error } = await supabase
      .from('reel_comments')
      .select(`
        *,
        user:users!reel_comments_user_id_fkey(
          id, display_name, avatar, user_type
        )
      `)
      .eq('reel_id', reelId)
      .is('parent_comment_id', null) // Only top-level comments
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    // Enrich comments with like counts and replies
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        // Get like count
        const { count: likeCount } = await supabase
          .from('reel_comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id);

        // Get reply count
        const { count: replyCount } = await supabase
          .from('reel_comments')
          .select('*', { count: 'exact', head: true })
          .eq('parent_comment_id', comment.id);

        return {
          ...comment,
          like_count: likeCount || 0,
          reply_count: replyCount || 0
        };
      })
    );

    res.json(enrichedComments);
  } catch (error) {
    console.error('Error fetching reel comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add comment to reel
app.post('/api/reels/:reelId/comments', async (req, res) => {
  try {
    const { reelId } = req.params;
    const { userId, comment, parentCommentId } = req.body;

    const { data: newComment, error } = await supabase
      .from('reel_comments')
      .insert({
        reel_id: reelId,
        user_id: userId,
        comment: comment,
        parent_comment_id: parentCommentId || null
      })
      .select(`
        *,
        user:users!reel_comments_user_id_fkey(
          id, display_name, avatar, user_type
        )
      `)
      .single();

    if (error) throw error;

    // Create notification for reel owner
    const { data: reel } = await supabase
      .from('reels')
      .select('user_id')
      .eq('id', reelId)
      .single();

    if (reel && reel.user_id !== userId) {
      await supabase
        .from('notifications')
        .insert({
          user_id: reel.user_id,
          actor_id: userId,
          type: 'comment',
          message: 'commented on your reel'
        });
    }

    res.json(newComment);
  } catch (error) {
    console.error('Error adding reel comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Like/unlike a reel comment
app.post('/api/reels/comments/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    // Check if user already liked the comment
    const { data: existingLike } = await supabase
      .from('reel_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from('reel_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      res.json({ liked: false });
    } else {
      // Like
      await supabase
        .from('reel_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId
        });

      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record reel view
app.post('/api/reels/:reelId/view', async (req, res) => {
  try {
    const { reelId } = req.params;
    const { userId, viewDuration } = req.body;

    // Record the view
    await supabase
      .from('reel_views')
      .insert({
        reel_id: reelId,
        viewer_id: userId,
        view_duration: viewDuration || 0
      });

    // Update reel view count
    await supabase
      .from('reels')
      .update({ view_count: supabase.rpc('increment') })
      .eq('id', reelId);

    res.json({ viewed: true });
  } catch (error) {
    console.error('Error recording reel view:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's reels
app.get('/api/users/:userId/reels', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data: reels, error } = await supabase
      .from('reels')
      .select('*')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json(reels);
  } catch (error) {
    console.error('Error fetching user reels:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get saved reels for a user
app.get('/api/users/:userId/saved-reels', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data: savedReels, error } = await supabase
      .from('reel_saves')
      .select(`
        *,
        reel:reels!reel_saves_reel_id_fkey(
          *,
          user:users!reels_user_id_fkey(
            id, display_name, avatar, user_type
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json(savedReels.map(item => item.reel));
  } catch (error) {
    console.error('Error fetching saved reels:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready for real-time notifications`);
}); 