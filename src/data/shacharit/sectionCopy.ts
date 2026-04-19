import type { SectionId } from '../../theme/shacharitTheme';

export const SECTION_BODY: Record<SectionId, string> = {
  birchot:
    'We begin by acknowledging the gift of a new day and the body that carries us. These blessings are the first words we offer — gratitude before requests, wonder before work.',
  pesukei:
    "Before we can ask, we must praise. Pesukei D'Zimra gathers the Psalms that sing the world into its right relationship: creation marveled at, the Creator named, the soul tuned.",
  shema:
    'Here the service gathers itself. After gratitude and praise, we arrive at the declaration: God is One. The Shema is less a prayer than a stance — the posture the rest of the day rests upon.',
  concluding:
    'The service ends with a turn outward. Alenu speaks of the world as it is and the world as it could be, then Kaddish raises the name of God in the voice of the community.',
};

export const SECTION_COMMENTARY: Record<SectionId, string> = {
  birchot:
    'Before reciting Birchot HaShachar, the tradition asks us to pause at the threshold of consciousness. The soul, returned by God in the night, is greeted with thanks before a single need is named. The structure of the blessings — body, then mind, then spirit — mirrors the order of waking itself.',
  pesukei:
    'The Talmud calls these verses "the warmup of the service." One does not leap into the presence of God; one prepares the voice, the body, the attention.',
  shema:
    'The Shema is the only prayer the tradition insists we recite with full concentration, even if every other word of the service slips past us. Its six words — "Hear O Israel, the Lord our God, the Lord is One" — are said to contain the entire argument of Jewish theology in miniature.',
  concluding:
    'We do not end with another petition but with a declaration of responsibility. The prayer has shaped us; now it releases us, equipped, back into ordinary time.',
};

export const SECTION_AUDIO_NOTES: Record<SectionId, string> = {
  birchot:
    'The morning blessings evolved from private practices recited at home into the communal opening of Shacharit. Listening while reading allows the learner to absorb both the cantillation and the reasoning behind each blessing in a single pass.',
  pesukei:
    'The Psalms of David were chosen as the entry-corridor into deeper prayer precisely because they do not argue: they sing. Audio accompaniment here lets the learner feel the rise and fall of the verses before parsing their meaning.',
  shema:
    'The Shema is recited twice daily — morning and evening — and tradition teaches that it is the last thing uttered before sleep and the first thing reached for on waking. The audio commentary unpacks why these six words carry that weight.',
  concluding:
    'Alenu began as a High Holidays prayer and migrated into daily use — a small history lesson in how communal liturgy evolves. The audio walks through that arc and what the ending wants from us.',
};

export const SECTION_AUDIO_DURATIONS: Record<SectionId, string> = {
  birchot: '4:32',
  pesukei: '5:18',
  shema: '6:47',
  concluding: '3:55',
};
