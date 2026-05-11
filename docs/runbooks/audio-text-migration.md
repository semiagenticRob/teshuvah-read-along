# Audio + Text Migration Runbook

Per-prayer order of operations for migrating a Shacharit prayer from Sefaria-sourced content to Feigenbaum. Following this order is load-bearing: skipping or reordering steps silently desyncs audio with highlighting (see `scripts/SYNC_PROTOCOL.md` for the underlying coupling).

## Ground rule

Hebrew text, audio recording, and timing JSON are coupled. Any change to one demands regeneration of the downstream artifacts in this order:

1. **Hebrew text** is the index source. The bundled JSON's `he` array defines the visual word sequence the highlight follows.
2. **Audio MP3** is the audible source. It must read the same Hebrew word sequence.
3. **Timing JSON** is derived. It maps audio timestamps to word positions in the bundled Hebrew.

If you change Hebrew without re-recording, audio falls behind/ahead of the highlight. If you change audio without regenerating timing, the highlight goes out of sync. If you regenerate timing against an old Hebrew JSON, indices shift and the highlight points at the wrong words.

## Per-prayer migration steps

For each prayer (e.g. `modeh_ani`):

### 1. Extract Feigenbaum Hebrew + English

```bash
node scripts/extract-feigenbaum.mjs --prayer modeh_ani
```

Writes the new `src/data/bundled/shacharit/modeh_ani.json` with:
- `ref` — Feigenbaum reference string
- `he[]` — Hebrew lines from the Feigenbaum PDF (preserve nikud)
- `text[]` — English translation/explanation from the Feigenbaum PDF
- `source: "feigenbaum"`
- `heTitle: "modeh_ani"`

### 2. Diff against existing Sefaria content

Inspect the diff before continuing. The intent here is to surprise yourself before audio gets recorded:

```bash
git diff src/data/bundled/shacharit/modeh_ani.json
```

Look for:
- Word-order changes (rare but possible for variant readings).
- Word-count changes (recorder needs to know).
- Line-count changes (timing JSON re-segmentation impact).

If word count changes substantially, `assets/timing/shacharit/wordCounts.json` needs to be regenerated after content is finalized.

### 3. Port transliteration

```bash
node scripts/port-sefaria-translit.mjs --prayer modeh_ani
```

Word-aligns the existing Sefaria-derived `src/data/bundled/shacharit/modeh_ani.translit.json` against the new Feigenbaum Hebrew. Emits a gap report listing words where the port fails (Feigenbaum has Hebrew but Sefaria translit doesn't align). Fill gaps by hand in the `.translit.json`, or regenerate from the Hebrew via `python3 scripts/generate_shacharit_translit.py modeh_ani`.

### 4. Anchor commentary

```bash
node scripts/anchor-commentary.mjs --prayer modeh_ani
```

Drafts `commentary[]` entries on `modeh_ani.json`. Each entry is `{ lineIndex, wordIndex?, marker, text, tone? }`. The script is heuristic — every anchor needs editorial review. Markers use the symbols `*`, `†`, `‡`, then `1`, `2`, `3`, ... when more than three on a line.

### 5. Tag minyan-only segments

By hand, populate the `segments[]` array in `modeh_ani.json` for any line that should be hidden for solo daveners (Kaddish, Barchu response, Kedushah, etc.):

```json
"segments": [
  { "lineIndex": 4, "minyanOnly": true, "minyanLabel": "Half Kaddish" }
]
```

For Modeh Ani there are none. For longer prayers (Pesukei Dezimrah, Amidah, Tachanun) expect several.

### 6. Record audio

Studio session with the canonical voice. Output: `assets/audio/shacharit/modeh_ani.mp3`.

The recording must read the new Hebrew JSON's word sequence end-to-end. If the recorder skips or adds words, regenerate the bundled JSON to match — audio is the audible truth but Hebrew text is the visual truth, and they must agree.

### 7. Regenerate timing

```bash
python3 scripts/whisper_align_timing.py shacharit modeh_ani
```

Reads `assets/audio/shacharit/modeh_ani.mp3` + `assets/whisper_raw/shacharit/modeh_ani.json` and writes `assets/timing/shacharit/modeh_ani.json`.

If a different alignment pipeline is chosen for Feigenbaum recordings (forced alignment, manual placement), substitute the appropriate script here.

### 8. Smoke test alignment quality

```bash
python3 scripts/inspect_prayer.py shacharit modeh_ani
```

Per `scripts/SYNC_PROTOCOL.md`, look for:
- `MISMATCH` — Whisper word doesn't match bundled Hebrew word. Fix the alignment script before continuing.
- `SLIVER` — word duration ≤ 50 ms (will be visually skipped). Investigate before shipping.
- `GAP` — gap > 500 ms between consecutive words (highlight will freeze). Investigate.

### 9. Manual QA on-device

Run `/shacharit-qa` against the branch. Specifically, for the migrated prayer:
- Words highlight in order with audio.
- Footnote markers appear inline; tapping opens the panel with correct text.
- Minyan-only lines render as a single italic note; audio skips them (V2 wiring) or the user pauses past them (V1).
- Display-lane toggles (Hebrew / Hebrew+translit / +English / +commentary) all render cleanly.

### 10. Flip the source marker

Confirm `source: "feigenbaum"` in the JSON. Commit Hebrew JSON + translit JSON + audio MP3 + timing JSON together.

## Order of prayers (V1 migration sequence)

Shortest first to retire risk:

1. modeh_ani
2. netilat_yadayim
3. asher_yatzar
4. elokai_neshama
5. birchot_hatorah
6. birchot_hashachar
7. akedah
8. korbanot
9. pesukei_dezimrah
10. shema
11. amidah
12. tachanun
13. ashrei_uva_letziyon
14. aleinu
15. shir_shel_yom

After all 15 are migrated and verified, V1 is content-complete and ready for App Store submission per `docs/plans/app-store-submission.md`.

## Recovery — what to do if highlight is out of sync

Per `scripts/SYNC_PROTOCOL.md`:
- Re-run step 7 (`whisper_align_timing.py`) — re-generates timing from immutable whisper raw + the current bundled Hebrew.
- If still off, the audio is reading different Hebrew than the JSON. Re-record (step 6) or correct the Hebrew JSON to match the recording (step 1).
- Avoid hand-editing `assets/timing/shacharit/{prayer}.json` — fix the alignment script so the fix applies across all prayers.
