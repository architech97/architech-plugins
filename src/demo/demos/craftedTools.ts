
import './crafted.css'

export function downloadCsv(name: string, headers: string[], rows: (string | number)[][]) {
  const encode = (value: string | number) => {
    const text = String(value)
    const safe = /^[=\-+@\t\r]/.test(text) ? "'" + text : text
    return '"' + safe.replaceAll('"', '""') + '"'
  }
  const content = [headers, ...rows].map((row) => row.map(encode).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
