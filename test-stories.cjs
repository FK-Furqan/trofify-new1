const pool = require('./backend/db');

async function testStories() {
  try {
    console.log('Testing stories functionality...');
    
    // Check if stories table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stories'
      );
    `);
    
    console.log('Stories table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get all stories
      const stories = await pool.query('SELECT * FROM stories ORDER BY created_at DESC');
      console.log('Total stories in database:', stories.rows.length);
      console.log('Stories:', stories.rows);
      
      // Get stories from last 24 hours
      const recentStories = await pool.query(`
        SELECT stories.*, users.email, users.user_type 
        FROM stories 
        JOIN users ON stories.user_id = users.id 
        WHERE stories.created_at > NOW() - INTERVAL '24 hours' 
        ORDER BY created_at DESC
      `);
      console.log('Recent stories (last 24 hours):', recentStories.rows.length);
      console.log('Recent stories:', recentStories.rows);
    }
    
  } catch (error) {
    console.error('Error testing stories:', error);
  } finally {
    await pool.end();
  }
}

testStories(); 