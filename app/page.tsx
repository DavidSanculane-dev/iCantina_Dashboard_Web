'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
// Local fallback ExportButtons to avoid missing-module error
type ExportButtonsProps = { data: any[] }

function ExportButtons({ data }: ExportButtonsProps) {
  function download(filename: string, content: string, type = 'text/csv') {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function toCSV(items: any[]) {
    if (!items || items.length === 0) return ''
    const keys = Object.keys(items[0])
    const rows = items.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))
    return [keys.join(','), ...rows].join('\n')
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => download('data.json', JSON.stringify(data, null, 2), 'application/json')}>Export JSON</button>
      <button style={{ marginLeft: 8 }} onClick={() => download('data.csv', toCSV(data), 'text/csv')}>Export CSV</button>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<any[]>([])
  const clientId = 'd2f16347-b106-47d3-ad02-0576d05a801d' // ✅ teu client

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data, error } = await supabase
      .from('meal_log')
      .select('*')
      .eq('client_id', clientId)
      .order('consumed_at', { ascending: false })

    if (!error) setData(data || [])
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 iCantina Dashboard</h2>

      <ExportButtons data={data} />

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Cantina</th>
            <th>Valor</th>
            <th>Data</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td>{item.employee_id}</td>
              <td>{item.cantina}</td>
              <td>{item.valor_refeicao}</td>
              <td>{new Date(item.consumed_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}