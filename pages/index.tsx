import { createClient } from '@supabase/supabase-js'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Database } from '../lib/database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

type Task = Database['public']['Tables']['tasks']['Row']

const Home: NextPage = () => {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const getInitialMessages = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select()
        .order('created_at', { ascending: false })
      if (error) {
        alert(error.message)
      } else if (data) {
        setTasks(data)
      }
    }
    getInitialMessages()

    const tasksChannel = supabase.channel('tasks')
    tasksChannel
      .on<Task>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          setTasks((prev) => [payload.new, ...prev])
        }
      )
      .on<Task>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => {
          setTasks((prev) => {
            const updatedTask = payload.new
            const targetIndex = prev.findIndex(
              (task) => task.id == updatedTask.id
            )
            if (targetIndex >= 0) {
              prev[targetIndex] = updatedTask
            }
            return prev
          })
        }
      )
      .on<Task>(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        (payload) => {
          setTasks((prev) => prev.filter((task) => task.id == payload.old.id))
        }
      )

    return () => {
      supabase.removeAllChannels()
    }
  }, [])

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    console.log('handle submit called')
    e.preventDefault()
    const form = e.currentTarget
    const { content } = Object.fromEntries(new FormData(form))

    if (typeof content === 'string' && content.trim().length !== 0) {
      form.reset()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user == null) {
        return alert('User is not signed in')
      }
      const { error } = await supabase.from('tasks').insert({
        user_id: user!.id,
        content: content.trim(),
      })

      if (error) {
        return alert(error.message)
      }
    }
  }

  return (
    <div className="bg-black">
      <Head>
        <title>Simple Todo</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="p-4 flex flex-col h-screen">
        <div className="flex-grow overflow-y-scroll">
          <ul className="flex flex-col items-start justify-start">
            {tasks.map((task) => (
              <li className="pb-2 flex" key={task.id}>
                <div className="bg-green-500 px-2 py-1 rounded">
                  {task.content}
                </div>
                <span className="ml-2 text-zinc-500 text-sm">
                  {task.created_at}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            className="p-2 rounded w-full"
            type="text"
            name="content"
            placeholder="新しいタスクを入力..."
          />
        </form>
      </main>
    </div>
  )
}

export default Home
