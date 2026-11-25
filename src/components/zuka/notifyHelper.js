import { supabase } from '@/integrations/supabase/client';

export async function sendZukaNotification({ receiverId, senderId, type, message }) {
  if (!receiverId || String(receiverId) === String(senderId)) return;
  try {
    await supabase.from('notifications').insert({
      user_id: receiverId,
      actor_id: senderId || null,
      type: type || 'info',
      message
    });
  } catch (_) {}
}
