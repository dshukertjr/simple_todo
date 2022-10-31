import { createClient } from '@supabase/supabase-js'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

const Home: NextPage = () => {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const getInitialMessages = async () => {
      const { data, error } = await supabase
        .from<Message>('tasks')
        .select()
        .order('created_at', { ascending: false })
      if (error) {
        alert(error.message)
      } else if (data) {
        setMessages(data)
      }
    }
    getInitialMessages()

    // const subscription = supabase
    //   .from<Message>(`tasks`)
    //   .on('INSERT', (payload) => {
    //     setMessages((current) => [payload.new, ...current])
    //   })
    //   .subscribe()

    return () => {
      supabase.removeAllChannels()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const { message } = Object.fromEntries(new FormData(form))

    if (typeof message === 'string' && message.trim().length !== 0) {
      form.reset()
      const { error } = await supabase
        .from('tasks')
        .insert({ content: message })

      if (error) {
        alert(error.message)
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
            {messages.map((message) => (
              <li className="pb-2 flex" key={message.id}>
                <div className="bg-green-500 px-2 py-1 rounded">
                  {message.content}
                </div>
                <span className="ml-2 text-zinc-500 text-sm">
                  {message.created_at}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            className="p-2 rounded w-full"
            type="text"
            name="task"
            placeholder="新しいタスクを入力..."
          />
        </form>
      </main>
    </div>
  )
}

export default Home
