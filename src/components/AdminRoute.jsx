import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // আপনার supabaseClient.js এর সঠিক পাথ দিন

export default function AdminRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAdmin() {
      // ১. বর্তমান লগইন করা ইউজারের তথ্য নেওয়া
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // ২. user_roles টেবিল থেকে চেক করা সে superAdmin কি না
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!error && data && data.role === 'superAdmin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    }

    verifyAdmin();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>যাচাই করা হচ্ছে...</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
        <h2>অ্যাক্সেস অস্বীকৃত!</h2>
        <p>আপনার এই পেজে ঢোকার অনুমতি নেই। আপনি সুপার এডমিন নন।</p>
      </div>
    );
  }

  return children;
}
