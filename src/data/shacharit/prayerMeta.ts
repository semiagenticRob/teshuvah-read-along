export interface PrayerMeta {
  subtitle: string;
  audioDuration: string;
  audioTitle?: string;
}

export const PRAYER_META: Record<string, PrayerMeta> = {
  modeh_ani: {
    subtitle: "First words on waking",
    audioDuration: "2:15",
  },
  reishis_chochmah: {
    subtitle: "The root of gaining wisdom",
    audioDuration: "1:30",
  },
  netilat_yadayim: {
    subtitle: "Washing the hands — purity at the threshold of the day",
    audioDuration: "1:50",
  },
  asher_yatzar: {
    subtitle: "The body's miraculous ordinary function",
    audioDuration: "3:10",
  },
  elokai_neshama: {
    subtitle: "Acknowledging the soul, returned from sleep",
    audioDuration: "2:48",
  },
  birchot_hashachar: {
    subtitle: "Fifteen morning blessings — waking the senses, the body, the mind",
    audioDuration: "5:40",
  },
  birchot_hatorah: {
    subtitle: "Sanctifying Torah study as the day's first labor",
    audioDuration: "3:22",
  },
  akedah: {
    subtitle: "The binding of Isaac — recalled each morning",
    audioDuration: "4:15",
  },
  korbanot: {
    subtitle: "The order of the Temple offerings, preserved in word",
    audioDuration: "6:30",
  },
  pesukei_dezimrah: {
    subtitle: "Verses of Praise — the ascent of song before the Shema",
    audioDuration: "9:20",
  },
  shema: {
    subtitle: "The declaration of God's oneness — the heart of the service",
    audioDuration: "8:45",
  },
  amidah: {
    subtitle: "The Silent Standing Prayer — three steps into presence",
    audioDuration: "11:00",
  },
  tachanun: {
    subtitle: "Supplications after the Amidah — the face placed in the arm",
    audioDuration: "4:40",
  },
  ashrei_uva_letziyon: {
    subtitle: "Closing Ashrei and the redeemer's promise",
    audioDuration: "3:50",
  },
  aleinu: {
    subtitle: "Duty to the world — the responsibility of being chosen",
    audioDuration: "3:18",
  },
  shir_shel_yom: {
    subtitle: "The psalm of the day — the song for this weekday",
    audioDuration: "2:55",
  },
  pitum_haketores: {
    subtitle: "Recitation of the incense formula — a daily echo of the Temple",
    audioDuration: "3:30",
  },
  shesh_zechiros: {
    subtitle: "Six biblical remembrances — what to carry every day",
    audioDuration: "1:45",
  },
};
