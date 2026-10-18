# commutez.app

Statisk nettside for Commutez: forside, personvernerklæring og support.
Hostes gratis på GitHub Pages med eget domene og automatisk HTTPS.

| Side | URL | Brukes i App Store Connect som |
|---|---|---|
| `index.html` | https://commutez.app/ | Marketing URL |
| `privacy/index.html` | https://commutez.app/privacy/ | Privacy Policy URL |
| `support/index.html` | https://commutez.app/support/ | Support URL |

Ingen byggesteg, ingen eksterne skript eller fonter (systemfonter: SF på
Apple-enheter), ingen sporing. Farger fra appens `Palette.swift`.

## Publisere (engangsoppsett)

1. **GitHub:** opprett et offentlig repo (f.eks. `river350/commutez-site`) og push.
   Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
   Filen `CNAME` setter eget domene til `commutez.app` automatisk.
2. **DNS hos Domeneshop** (Domener → commutez.app → DNS), slett eventuelle
   gamle A-/AAAA-poster for `@` først:

   | Type | Navn | Verdi |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |
   | CNAME | www | river350.github.io |

3. Vent til GitHub viser «DNS check successful», og kryss av **Enforce HTTPS**.
   Sertifikatet kan ta opptil en time første gang. `.app` krever HTTPS, så
   siden åpner ikke i nettleseren før dette er ferdig.
4. **E-post:** Domeneshop → commutez.app → E-post → videresending
   `support@commutez.app` → din Gmail. Adressen brukes på alle sidene.
5. (Anbefalt) Verifiser domenet i GitHub: profilens Settings → Pages →
   *Add a domain*. Da kan ingen andre ta over `commutez.app` på GitHub Pages.

## Når appen er i App Store

Bytt ut `<span class="badge-soon">…</span>` i `index.html` med lenken til
App Store-siden.

## Universal links senere

`.nojekyll` gjør at GitHub Pages serverer `.well-known/`. Legg
`apple-app-site-association` der når appen skal åpne commutez.app-lenker.

## Forhåndsvise lokalt

```
python3 -m http.server 8787
```

Åpne http://localhost:8787.
