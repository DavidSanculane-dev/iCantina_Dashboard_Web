'use client'

import * as XLSX from 'xlsx'
// TypeScript: file-saver may not provide types in this project. Ignore the missing declaration here.
// @ts-ignore
import { saveAs } from 'file-saver'

export default function ExportButtons({ data }: any) {

  function exportCSV() {
    const rows = data.map((item: any) =>
      `${item.employee_id},${item.cantina},${item.valor_refeicao},${item.consumed_at}`
    )

    const csv = "Employee,Cantina,Valor,Data\n" + rows.join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'refeicoes.csv'
    a.click()
  }

  function exportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Refeicoes')

    const buffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })

    const blob = new Blob([buffer])
    saveAs(blob, 'refeicoes.xlsx')
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={exportCSV}>⬇ Export CSV</button>
      <button onClick={exportExcel} style={{ marginLeft: 10 }}>
        ⬇ Export Excel
      </button>
    </div>
  )
}
