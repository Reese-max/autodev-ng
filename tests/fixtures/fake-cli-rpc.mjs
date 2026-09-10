// Native metadata transport fixture: no inference, login, network or session mutation.
let buffer = Buffer.alloc(0)
const framed = process.argv.includes('--framed')
process.stdin.on('data', chunk => {
  buffer = Buffer.concat([buffer, chunk])
  while (buffer.length) {
    let text
    if (framed) {
      const end = buffer.indexOf('\r\n\r\n'); if (end < 0) return
      const size = Number(/Content-Length:\s*(\d+)/i.exec(buffer.subarray(0, end).toString())[1])
      if (buffer.length < end + 4 + size) return
      text = buffer.subarray(end + 4, end + 4 + size).toString(); buffer = buffer.subarray(end + 4 + size)
    } else {
      const end = buffer.indexOf(10); if (end < 0) return
      text = buffer.subarray(0, end).toString(); buffer = buffer.subarray(end + 1)
    }
    const request = JSON.parse(text)
    if (request.id === undefined || process.env.RPC_TEST_MODE === 'hang') continue
    if (process.env.RPC_TEST_MODE === 'bad-length') { process.stdout.write('Content-Length: 99999999\r\n\r\n'); continue }
    const body = JSON.stringify({ jsonrpc: '2.0', id: request.id, result: { method: request.method, text: '測試', pid: process.pid } })
    const bytes = Buffer.from(framed ? 'Content-Length: ' + Buffer.byteLength(body) + '\r\n\r\n' + body : body + '\n')
    const cut = bytes.indexOf(Buffer.from('測')) + 1
    process.stdout.write(bytes.subarray(0, cut))
    setTimeout(() => process.stdout.write(bytes.subarray(cut)), 15)
  }
})
process.stdin.on('end', () => process.exit(0))
