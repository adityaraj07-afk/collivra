import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'

export function useConnections() {
  const { user } = useAuth()
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('connections')
      .select('*, sender:student_profiles!connections_sender_id_fkey(id,name,photo_url,college,year,branch,department,skills,skills_detailed), receiver:student_profiles!connections_receiver_id_fkey(id,name,photo_url,college,year,branch,department,skills,skills_detailed)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
    setConnections(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Returns: 'none' | 'sent' | 'received' | 'connected'
  const statusWith = useCallback((otherId) => {
    const row = connections.find(c =>
      (c.sender_id === user?.id && c.receiver_id === otherId) ||
      (c.receiver_id === user?.id && c.sender_id === otherId)
    )
    if (!row) return 'none'
    if (row.status === 'accepted') return 'connected'
    if (row.status === 'declined') return 'none'
    return row.sender_id === user?.id ? 'sent' : 'received'
  }, [connections, user])

  const connectionWith = useCallback((otherId) => {
    return connections.find(c =>
      (c.sender_id === user?.id && c.receiver_id === otherId) ||
      (c.receiver_id === user?.id && c.sender_id === otherId)
    ) || null
  }, [connections, user])

  const sendRequest = async (receiverId) => {
    if (statusWith(receiverId) !== 'none') return
    const { error } = await supabase.from('connections')
      .insert({ sender_id: user.id, receiver_id: receiverId, status: 'pending' })
    if (!error) await load()
    return error
  }

  const respond = async (connectionId, accept) => {
    await supabase.from('connections')
      .update({ status: accept ? 'accepted' : 'declined' })
      .eq('id', connectionId)
    await load()
  }

  const cancelRequest = async (connectionId) => {
    await supabase.from('connections').delete().eq('id', connectionId)
    await load()
  }

  const accepted = connections.filter(c => c.status === 'accepted')
  const received = connections.filter(c => c.status === 'pending' && c.receiver_id === user?.id)
  const sent = connections.filter(c => c.status === 'pending' && c.sender_id === user?.id)

  const otherProfile = (c) => (c.sender_id === user?.id ? c.receiver : c.sender)

  const connectedIds = accepted.map(c => (c.sender_id === user?.id ? c.receiver_id : c.sender_id))

  return {
    connections,
    accepted,
    received,
    sent,
    connectedIds,
    otherProfile,
    statusWith,
    connectionWith,
    sendRequest,
    respond,
    cancelRequest,
    reload: load,
    loading,
  }
}
