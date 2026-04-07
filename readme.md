start:
* apri cmd in cartella
* `
    npm install
`

* `
    npm run dev
`

per check app
* `
    npm install
`
* `
    npm run build
`
* `
    npm run preview
`

node -v
`v20.15.1` https://nodejs.org/en/blog/release/v20.15.1


live https://scomodo-mappa-evento.pages.dev/


controlli mappa da console browser:
```
__banner.hide()    // hide the banner
__banner.show()    // show it again
__banner.toggle()  // flip current state
__banner.status()  // log current visibility state
```

* templateEmailJsUffaBackup:
    * subject: Nuova storia da {{nome}} ({{cittaPartenza}} → {{cittaArrivo}})
    * Content: {
            "nome": "{{nome}}",
            "eta": {{eta}},
            "cittaPartenza": "{{cittaPartenza}}",
            "cittaArrivo": "{{cittaArrivo}}",
            "data": "{{data}}",
            "storia": "{{storia}}",
            "tipo": true
        },
    * settings:
        * template ID: template_zv8c2s4