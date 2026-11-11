const encoder = new TextEncoder()
const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function header(size: number, signature: number) {
  const bytes = new Uint8Array(size)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, signature, true)
  return { bytes, view }
}
function zip(files: [string, string][]) {
  const local: Uint8Array[] = [], central: Uint8Array[] = []
  let offset = 0
  for (const [filename, content] of files) {
    const name = encoder.encode(filename), data = encoder.encode(content), crc = crc32(data)
    const file = header(30 + name.length, 0x04034b50)
    file.view.setUint16(4, 20, true)
    file.view.setUint32(14, crc, true); file.view.setUint32(18, data.length, true); file.view.setUint32(22, data.length, true)
    file.view.setUint16(26, name.length, true); file.bytes.set(name, 30)
    const directory = header(46 + name.length, 0x02014b50)
    directory.view.setUint16(4, 20, true); directory.view.setUint16(6, 20, true)
    directory.view.setUint32(16, crc, true); directory.view.setUint32(20, data.length, true); directory.view.setUint32(24, data.length, true)
    directory.view.setUint16(28, name.length, true); directory.view.setUint32(42, offset, true); directory.bytes.set(name, 46)
    local.push(file.bytes, data); central.push(directory.bytes)
    offset += file.bytes.length + data.length
  }
  const end = header(22, 0x06054b50)
  end.view.setUint16(8, files.length, true); end.view.setUint16(10, files.length, true)
  end.view.setUint32(12, central.reduce((total, file) => total + file.length, 0), true); end.view.setUint32(16, offset, true)
  const chunks = [...local, ...central, end.bytes]
  const output = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0))
  let at = 0
  for (const chunk of chunks) { output.set(chunk, at); at += chunk.length }
  return output
}
export function downloadWorkbook(sheets: { name: string; rows: string[][] }[]) {
  const files: [string, string][] = [
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>'],
    ['_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml', '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheets.map(({ name }, i) => '<sheet name="' + xml(name.slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '</Relationships>'],
    ...sheets.map(({ rows }, index): [string, string] => ['xl/worksheets/sheet' + (index + 1) + '.xml',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + rows.map((row, i) =>
        '<row r="' + (i + 1) + '">' + row.map((value, column) => '<c r="' + String.fromCharCode(65 + column) + (i + 1) + '" t="inlineStr"><is><t xml:space="preserve">' + xml(value) + '</t></is></c>').join('') + '</row>').join('') + '</sheetData></worksheet>']),
  ]
  const bytes = zip(files)
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = 'Sample-Residence-Editable-Schedules.xlsx'; anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
