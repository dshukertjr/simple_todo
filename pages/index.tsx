import { createClient, User } from '@supabase/supabase-js'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { Database } from '../lib/database.types'

// Supabaseのクライアントを初期化
const supabase = createClient<Database>(
  'https://bjyreabarfzxvtsmjpel.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqeXJlYWJhcmZ6eHZ0c21qcGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDE2Njk4ODMsImV4cCI6MjAxNzI0NTg4M30.r-HNlgxPTbKwKbFGzDRdrF0sbPLQcKlNHTAxeLXz8Ro'
)

type Task = Database['public']['Tables']['tasks']['Row']

const Home: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const getInitialUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getInitialUser()

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

    // `tasks`テーブルに対してリアルタイムリスナーをセットアップ
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
            return [...prev]
          })
        }
      )
      .on<Task>(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        (payload) => {
          setTasks((prev) => prev.filter((task) => task.id != payload.old.id))
        }
      )
      .subscribe()
  }, [])

  // ログイン処理を行う
  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()
    const form = e.currentTarget
    const { email } = Object.fromEntries(new FormData(form))

    if (typeof email === 'string') {
      // マジックリンクを使ってログイン
      await supabase.auth.signInWithOtp({ email })

      alert('Emailに認証リンクが送信されました')
    }
  }

  // 新しいタスクを`tasks`テーブルに挿入
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()
    const form = e.currentTarget
    const { content } = Object.fromEntries(new FormData(form))

    // データのバリデーション
    if (typeof content === 'string' && content.length !== 0) {
      form.reset()

      // `tasks`テーブルにデータを格納
      await supabase.from('tasks').insert({ content })
    }
  }

  // チェックアイコンをクリックした時に`is_done`ステータスをアップデート
  const handleUpdate = async (taskId: number, newStatus: boolean) => {
    await supabase
      .from('tasks')
      .update({ is_done: newStatus })
      .match({ id: taskId })
  }

  // ゴミ箱アイコンをクリックした時にタスクを削除
  const handleDelete = async (taskId: number) => {
    await supabase.from('tasks').delete().match({ id: taskId })
  }

  return (
    <div className="bg-black">
      <Head>
        <title>Simple Todo</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {loading ? (
        <div className="h-screen"></div>
      ) : (
        <main className="h-screen">
          {user ? (
            <div className="p-4 flex flex-col h-full max-w-xl md:mx-auto">
              <div className="flex-grow overflow-y-scroll">
                <ul>
                  {tasks.map((task) => (
                    <li
                      className="pb-2 flex border-b-gray-600 border-b"
                      key={task.id}
                    >
                      <button
                        className="mr-2"
                        onClick={() => handleUpdate(task.id, !task.is_done)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className={`w-6 h-6 ${
                            task.is_done
                              ? 'stroke-green-500'
                              : 'stroke-gray-600'
                          }`}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>

                      <div className="px-2 py-1 rounded flex-grow text-white">
                        {task.content}
                        <div className="text-zinc-500 text-sm">
                          {new Date(task.created_at).toLocaleDateString('ja')}
                        </div>
                      </div>

                      <button
                        className="ml-2"
                        onClick={() => handleDelete(task.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6 stroke-red-500"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
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
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="px-8 w-full md:w-96">
                <form
                  onSubmit={handleLogin}
                  className="flex flex-col space-y-4"
                >
                  <input
                    className="p-2 rounded w-full"
                    type="email"
                    name="email"
                    placeholder="メールアドレス"
                  />
                  <button className="bg-green-500 text-white rounded block py-2">
                    マジックリンクでログイン
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  )
}

export default Home
