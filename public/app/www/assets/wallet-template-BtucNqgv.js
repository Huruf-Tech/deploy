const n=`<!DOCTYPE html>\r
<html lang="{{lang}}" dir="{{dir}}">\r
\r
<head>\r
  <meta charset="UTF-8">\r
  <meta name="viewport" content="width=device-width, initial-scale=1.0">\r
  <title>{{title}}</title>\r
\r
  <style>\r
    * { box-sizing: border-box; }\r
    html, body { margin: 0; padding: 0; }\r
    body { font-family: 'Cairo', system-ui, sans-serif; background: #fff; }\r
\r
    @page {\r
      size: A4;\r
      margin: 14mm;\r
    }\r
\r
    @media print {\r
      body {\r
        -webkit-print-color-adjust: exact;\r
        print-color-adjust: exact;\r
      }\r
\r
      thead {\r
        display: table-header-group;\r
      }\r
\r
      tr {\r
        break-inside: avoid;\r
        page-break-inside: avoid;\r
      }\r
    }\r
\r
    {{{tailwind}}}\r
    {{{fonts}}}\r
\r
    body {\r
      font-family: 'Cairo', system-ui, sans-serif;\r
      height: -webkit-fill-available;\r
    }\r
  </style>\r
</head>\r
\r
<body>\r
  {{{content}}}\r
</body>\r
<script>\r
  window.addEventListener("load", () => {\r
    setTimeout(() => window.print(), 500);\r
  });\r
<\/script>\r
\r
</html>\r
`;export{n as default};
