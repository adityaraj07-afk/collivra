import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'

export function useDirectMessages(otherUserId) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !otherUserId) return

    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      setMessages(data || [])
      setLoading(false)

      await supabase.from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id)
        .is('read_at', null)
    }
    load()

    const channel = supabase
      .channel(`dm-${user.id}-${otherUserId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'direct_messages',
      }, (payload) => {
        const m = payload.new
        const relevant =
          (m.sender_id === user.id && m.receiver_id === otherUserId) ||
          (m.sender_id === otherUserId && m.receiver_id === user.id)
        if (relevant) {
          setMessages((prev) => [...prev, m])
          if (m.sender_id === otherUserId) {
            supabase.from('direct_messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', m.id)
          }
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, otherUserId])

  const send = async (content) => {
    if (!content.trim()) return
    await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      content: content.trim(),
    })
  }

  return { messages, send, loading }
}
