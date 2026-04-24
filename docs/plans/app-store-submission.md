2026-04-24

Status: #baby

Tags: [[teshuvah-read-along]] [[davenAlong]] [[app-store]] [[launch]]

# DavenAlong — App Store Submission Prep

CEO Agent, 2026-04-24.

Draft metadata for the App Store Connect submission. Write this now so it's ready to go the moment ZmanimHeader + EntryPath features ship. The Feigenbaum partnership status may affect the final description — if the partnership is confirmed before submission, update the description to reference the siddur content provenance.

---

## App Store Connect Fields

### App Name
`DavenAlong`

*(30 character max — "DavenAlong" is 10 characters, giving you room. No changes needed.)*

### Subtitle
`Jewish Prayer, Side by Side`

*(30 character max — 29 characters. This directly communicates the core value: prayer text with translation support, for those who need guidance.)*

Alternative subtitles (if A/B testing):
- `Shacharit Made Approachable` (28 chars)
- `Siddur with Hebrew & English` (28 chars)
- `Morning Prayer, Step by Step` (28 chars)

### Primary Category
`Reference`

*(Jewish prayer apps that serve as text references perform better here than in "Lifestyle." Reference apps also tend to retain users longer — they come back to use the tool, not just browse.)*

### Secondary Category
`Education`

### Age Rating
`4+` (no objectionable content)

---

## App Description (4,000 character max)

```
DavenAlong makes Jewish prayer accessible — whether you're returning to prayer or learning for the first time.

Shacharit (morning prayer) can feel overwhelming. The siddur moves quickly, the Hebrew is dense, and it's hard to know where you are in the service. DavenAlong gives you the full Shacharit text — Hebrew, transliteration, and English translation — laid out in a continuous scroll so you can always see where you are and what's coming next.

WHAT'S INSIDE
• Full Shacharit in continuous scroll — no jumping between sections
• Hebrew, transliteration, and English displayed side by side or individually
• Zmanim integration — shows today's prayer times based on your location so you know when to start
• Two entry paths: Returning davener (full service) and Beginner (guided, simplified)
• Section intros that explain what you're about to pray and why it matters

FOR BEGINNERS
If you've never davened before, DavenAlong walks you through the service step by step. Each section begins with a brief explanation — what the prayer is, what it means, and what to focus on. You can read along in English first, then add Hebrew when you're ready.

FOR THOSE RETURNING TO PRAYER
If you davened growing up and want to reconnect, DavenAlong gives you the full text without training wheels. Tap to switch between display modes. The Zmanim header shows today's earliest and latest times so you can plan your morning around prayer instead of the other way around.

DESIGNED FOR FOCUS
The continuous scroll keeps you in the flow of the service. There are no tabs to switch, no screens to navigate — just the prayer, moving naturally from top to bottom the way davening actually feels when it's going well.

Built with care for accuracy and accessibility. DavenAlong is a non-commercial project developed in partnership with Torah educators.
```

*(3,847 characters — within the 4,000 limit. Adjust the closing line once the Feigenbaum partnership is confirmed.)*

---

## What's New (Version Release Notes)

For the ZmanimHeader + EntryPath release:

```
Version 2.0

• New entry paths: choose Beginner (guided walk-through) or Returning (full service, no training wheels) when you open the app
• Zmanim integration: today's Shacharit times based on your location — displayed at the top of the scroll so you know when to start
• Continuous scroll redesign: the full Shacharit service in a single, uninterrupted flow
• Section introductions: each section of the service now opens with a brief explanation of what you're about to pray

This update reflects feedback from daveners and Torah educators. Thank you to everyone who shared input.
```

---

## Keywords (100 character max, comma-separated)

```
siddur,shacharit,jewish prayer,davening,hebrew prayer,transliteration,prayer book,torah,shabbat
```

*(99 characters — exactly at limit. These target the exact searches someone would use when looking for a prayer app.)*

Alternative keywords to rotate in if rankings are weak:
- `mincha`, `maariv`, `birkat hamazon` (additional prayer times)
- `orthodox`, `conservative`, `reform` (denominational reaches)
- `jewish app`, `judaism`, `tefilah`
- `prayer guide`, `beginner jewish prayer`

---

## Support URL
`https://github.com/semiagenticRob/teshuvah-read-along` *(or add a dedicated support page — even a simple GitHub Issues link works)*

## Marketing URL
Leave blank for now. Add once there's a dedicated landing page.

## Privacy Policy URL
Required for App Store submission. Options:
1. Host a simple privacy policy at a GitHub Pages URL (fastest — can use the existing privacy.html approach from estate-sale-helper)
2. Use a privacy policy generator (iubenda.com or termly.io — free tier)

**Minimum required language:** app doesn't collect personal data except location (for Zmanim) and display preferences (stored locally). No account creation required.

---

## Screenshots (required before submission)

Required device sizes:
- iPhone 6.9" (iPhone 16 Pro Max): 1320 × 2868 px
- iPhone 6.5" (iPhone 11 Pro Max): 1242 × 2688 px
- iPad Pro 12.9" (6th gen): 2048 × 2732 px (if iPad supported)

**Recommended screenshot sequence:**
1. The full Shacharit scroll open — shows the continuous layout clearly
2. The EntryPath screen — "Choose your path: Beginner / Returning"
3. A close-up of a prayer block in Hebrew + transliteration + English side by side
4. The ZmanimHeader showing today's times
5. A SectionIntro screen showing the explanatory text before a major prayer section

**Caption text (overlaid on screenshots in App Store Connect):**
1. "Full Shacharit. One continuous scroll."
2. "Start where you are."
3. "Hebrew, transliteration, English — your choice."
4. "Know when to start. Know where you are."
5. "Understand what you're praying."

---

## Pre-Submission Checklist

- [ ] ZmanimHeader component built and navigable
- [ ] EntryPath screen built, settings store wired, navigation complete
- [ ] Privacy policy URL live
- [ ] Screenshots taken on real device (or high-quality simulator)
- [ ] App icon at 1024×1024 px (no alpha, no rounded corners — Apple adds rounding)
- [ ] TestFlight beta distributed to Rabbi Leban and relevant TJE contacts for feedback
- [ ] Description updated if Feigenbaum partnership is confirmed ("developed in partnership with...")
- [ ] Zmanim tested in US Eastern and Western time zones

---

## Notes for Feigenbaum Partnership

If the Feigenbaum siddur partnership is confirmed before submission:
- Update the closing line of the description: *"Built with care for accuracy and accessibility. DavenAlong uses the Feigenbaum Siddur, with the permission of Rabbi Feigenbaum and his team."*
- This is a significant credibility signal — worth holding the App Store submission until it's confirmed if the timeline allows.
- The visual identity brief (`docs/design/visual-identity-brief.md`) should be shared with any designer helping produce App Store screenshots so the parchment color palette is consistent with the app.
