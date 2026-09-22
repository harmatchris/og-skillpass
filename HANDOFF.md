# OG Skills-Pass - Entwickler-Übergabe

Coach-Tool zum Erfassen von Kinder-Skills und Drucken von Diplomen. Läuft als
PWA (auch auf dem Handy).

**Live:** https://harmatchris.github.io/og-skillpass/skillspass-aufgaben.html

## Architektur (bewusst simpel gehalten)
- **Eine Datei** ist die ganze App: `skillspass-aufgaben.html` (HTML + CSS + JS,
  ca. 5000 Zeilen). Kein Build-Schritt, keine Dependencies, kein Framework.
- `sw.js` = Service Worker (Offline / PWA-Cache). `manifest.json` = PWA-Manifest.
- **Hosting:** GitHub Pages. Repo `harmatchris/og-skillpass`, Branch `main`.
  Push auf `main` = nach ca. 1 Minute automatisch live.
- **Backend:** Firebase Realtime Database. Projekt `og-skills-pass-30a3e`,
  Region `europe-west1`.
- **Auth:** Firebase Anonymous. Coaches müssen sich nicht einloggen, die App
  authentifiziert sich beim Start selbst.

## Bearbeiten und veröffentlichen
1. `skillspass-aufgaben.html` bearbeiten.
2. `git commit -am "..."` und `git push origin main`.
3. Nach ca. 1 Minute live (GitHub Pages baut). Am Gerät Hard-Reload machen
   (wegen PWA-Cache: App ganz schliessen und neu öffnen).

Kein npm, kein Build, keine Installation nötig.

## Lokal testen
```bash
cd og-skillpass
python3 -m http.server 8765
# dann im Browser: http://localhost:8765/skillspass-aufgaben.html
```
Achtung: lokal nutzt dieselbe Live-Firebase. Zum gefahrlosen Ausprobieren in der
Browser-Konsole `_fbActive = false` setzen, dann werden keine Daten geschrieben.

## Datenmodell (Firebase, alles unter `/og-skillpass`)
- `appdata/data[kursId][kind][skillId]` = erfasster Wert (Score)
- `appdata/customSkills`, `appdata/skillOverrides` = kursspezifische Skills / Anpassungen
- `appdata/absent` = Abwesenheit pro Kind/Übung
- `appdata/timestamps` = wann ein Wert erfasst wurde
- `courses[tag][]` = Kursliste je Wochentag (0=So bis 6=Sa). Kurs =
  `{id, name, time, trainer, level, kids[], hidden?}`
- `master/kids`, `master/trainers` = zentrale Stammdaten (Head-Coach-Backend)
- `audit/` = Änderungs-Log (append-only, hält fest wer wann was geändert hat)

## Wichtige Code-Stellen (zum schnellen Finden)
- `DEFAULT_SKILLS`, `DEFAULT_COURSES` = Standard-Skill-Sets und Standard-Kurse
- `getCourseSkills()` = welche Skills ein Kurs hat (nach Typ + Custom + Overrides)
- `setVal()` / `getVal()` = Score setzen/lesen (granulare Firebase-Writes + Zeitstempel)
- `buildDiplomaView()` / `sportCardInnerHtml()` = Diplom-Druck
  (Vorderseite = Skill-Boxen, Rückseite = Kompetenzraster)
- `openBackendModal()` + `renderKidsTab` / `renderTrainersTab` / `renderCoursesTab` /
  `renderExcelTab` = Head-Coach-Backend (Stammdaten, Excel, Kurse mergen)
- `openSkillLibrary()` = mehrere Skills auf einmal in einen Kurs übernehmen

## Sicherheit / Head-Coach
- Head-Coach-Modus per geteiltem Passwort (als SHA-256-Hash im Code). Das
  Passwort bitte bei Chris erfragen (steht bewusst nicht hier).
- Nur der Head-Coach kann Kurse ausblenden oder Scores zurücksetzen.
- Firebase-Regeln: nur authentifizierte Nutzer lesen/schreiben; `audit` ist
  append-only (kann nicht gefälscht oder gelöscht werden).
- Der Firebase-API-Key im Code ist absichtlich öffentlich. Das ist bei
  Firebase-Web-Apps normal; der Schutz läuft über die Security-Regeln, nicht
  über Geheimhaltung.

## Backups und Wiederherstellung (wichtig)
- **Vor grösseren Änderungen** ein Backup ziehen: Firebase Console -> Realtime
  Database -> Menü (drei Punkte) -> "In JSON-Datei exportieren".
- Lokale Backups liegen bei Chris unter `~/og-skillpass-backups/`.
- App-seitige Netze: Audit-Log zeigt jede Änderung; Kurse werden "ausgeblendet"
  statt gelöscht (im Backend -> Kurse wiederherstellbar).
- Code-seitiges Netz: Git speichert jede Version. Bei einer kaputten Version
  einfach auf den letzten guten Commit zurück (`git revert <commit>` oder
  `git reset`), push, und die App ist wieder ok.

## Zusammenarbeit mit zwei Entwicklern (Sicherheitsnetz)
- Beide sind Collaborator auf dem GitHub-Repo. Jeder Commit ist ein
  Wiederherstellungspunkt, es geht also nichts wirklich verloren.
- Empfohlen fürs maximale Sicherheitsnetz: der zweite Entwickler arbeitet auf
  einem eigenen Branch und öffnet einen Pull Request; Chris prüft und merged auf
  `main`. So kann nichts Kaputtes live gehen, ohne dass Chris es freigibt.
- Firebase: als Mitglied mit Editor-Rolle hinzufügen. Daten regelmässig
  exportieren.
