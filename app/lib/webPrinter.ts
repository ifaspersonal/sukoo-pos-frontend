export function printViaWeb(receiptText: string) {
  const win = window.open("", "_blank");

  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Print Receipt</title>
        <style>
          body {
            font-family: monospace;
            white-space: pre;
            font-size: 14px;
            color: black;
          }
        </style>
      </head>
      <body>
${receiptText}
      </body>
    </html>
  `);

  win.document.close();
  win.focus();
  win.print();
}