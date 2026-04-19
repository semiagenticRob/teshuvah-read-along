export interface PrayerMeta {
  subtitle: string;
  commentary: string;
  audioDuration: string;
  audioTitle?: string;
}

export const PRAYER_META: Record<string, PrayerMeta> = {
  modeh_ani: {
    subtitle: "First words on waking — gratitude before speech",
    commentary: "Recited before the morning washing, in the half-light between sleep and waking. Tradition teaches its simplicity is what makes it safe to say with a tongue not yet alert.",
    audioDuration: "2:15",
  },
  netilat_yadayim: {
    subtitle: "Washing the hands — purity at the threshold of the day",
    commentary: "The day begins with a small physical act. The pouring of water over the hands marks the boundary between sleep, which is sometimes described as one-sixtieth of death, and the life that prayer is about to meet.",
    audioDuration: "1:50",
  },
  asher_yatzar: {
    subtitle: "The body's miraculous ordinary function",
    commentary: "A blessing that pairs the most physical of daily acts with gratitude — insisting the sacred and the ordinary occupy one plane.",
    audioDuration: "3:10",
  },
  elokai_neshama: {
    subtitle: "Acknowledging the soul, returned from sleep",
    commentary: "Each morning the soul is returned as a gift; the blessing names God as the Master of souls who will one day take it back.",
    audioDuration: "2:48",
  },
  birchot_hashachar: {
    subtitle: "Fifteen morning blessings — waking the senses, the body, the mind",
    commentary: "Originally recited privately at home as each action of waking was performed, these fifteen blessings were later gathered into the formal service. Reading them in order reconstructs the first moments of being alive.",
    audioDuration: "5:40",
  },
  birchot_hatorah: {
    subtitle: "Sanctifying Torah study as the day's first labor",
    commentary: "Before a word of scripture is read, we ask that it be sweet in our mouths and in our children's mouths — learning tied to love from the outset.",
    audioDuration: "3:22",
  },
  akedah: {
    subtitle: "The binding of Isaac — recalled each morning",
    commentary: "The reading of Genesis 22 opens the day with the tradition's most demanding narrative. Tradition holds that the merit of Abraham's and Isaac's trust is invoked on behalf of their descendants every morning.",
    audioDuration: "4:15",
  },
  korbanot: {
    subtitle: "The order of the Temple offerings, preserved in word",
    commentary: "After the Temple's destruction, speech took the place of sacrifice. Reading the order of korbanot keeps the memory — and the claim that words of prayer stand in their stead.",
    audioDuration: "6:30",
  },
  pesukei_dezimrah: {
    subtitle: "Verses of Praise — the ascent of song before the Shema",
    commentary: "The Talmud calls these verses \"the warmup of the service.\" One does not leap into the presence of God; one prepares the voice, the body, the attention. The psalms move the worshipper from the ordinary world into the posture of prayer.",
    audioDuration: "9:20",
  },
  shema: {
    subtitle: "The declaration of God's oneness — the heart of the service",
    commentary: "Six words the tradition teaches should be said with closed eyes and full concentration, even if every other word slips by. The blessings before and after the Shema frame it — creation, revelation, and redemption — as the three-fold axis on which the service turns.",
    audioDuration: "8:45",
  },
  amidah: {
    subtitle: "The Silent Standing Prayer — three steps into presence",
    commentary: "The central prayer of every service, whispered with feet together, body slightly bowed, in the attitude of one standing before a king. Nineteen blessings on weekdays, carrying the whole weight of communal need.",
    audioDuration: "11:00",
  },
  tachanun: {
    subtitle: "Supplications after the Amidah — the face placed in the arm",
    commentary: "The prayer of the broken-hearted, recited seated and with head resting on the forearm over the tefillin. Omitted on days of joy, because grief and festival cannot share one breath.",
    audioDuration: "4:40",
  },
  ashrei_uva_letziyon: {
    subtitle: "Closing Ashrei and the redeemer's promise",
    commentary: "A second recitation of Ashrei, now in the mouth of the one who has already moved through the Shema and Amidah. Uva L'Tziyon adds the promise of redemption and seals the main body of the service.",
    audioDuration: "3:50",
  },
  aleinu: {
    subtitle: "Duty to the world — the responsibility of being chosen",
    commentary: "Originally a High Holidays prayer; its daily use keeps the vision of a redeemed world at the close of every service.",
    audioDuration: "3:18",
  },
  shir_shel_yom: {
    subtitle: "The psalm of the day — the song for this weekday",
    commentary: "Each weekday has its own psalm, sung in the Temple as the Levites dismissed the day's service. Today's psalm returns us to ordinary time, equipped.",
    audioDuration: "2:55",
  },
};
