const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ubxsywaxdvkhiqepcvmq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase client not configured. Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your Vercel Environment Variables.' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { student_id, student_name, student_dept, rating, comment } = req.body;
      if (!student_id || !student_name || !rating || !comment) {
        return res.status(400).json({ error: 'Missing required parameters: student_id, student_name, rating, and comment are required.' });
      }

      const { error } = await supabase.from('reviews').insert({
        student_id,
        student_name,
        student_dept: student_dept || 'Student',
        rating: Number(rating),
        comment,
        approved: false // default false for moderation
      });

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Review submitted for moderation' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
