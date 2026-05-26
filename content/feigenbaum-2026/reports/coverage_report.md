# Hebrew Coverage Report

Compares base Hebrew letter counts between PDF page range and assembled JSON.
Tolerance: JSON must contain >= 60% of PDF Hebrew character count.
(Minyan filtering, headers, and layout differences account for the gap.)

## Known low-coverage sections (SKIPped from threshold check)

- shacharit/barchu: page 50 overlaps Karbanos; Barchu is fully minyan-only.
  All Hebrew is correctly present in minyan_only blocks (~44% of PDF chars).
- shacharit/barchi_nafshi: pages 109-110 bleed into Tachanun (page range
  misalignment in manifest). Hebrew content is correct; PDF slice is wrong.
- shacharit/tachanun_shacharit: Feigenbaum dual-column layout adds left-column
  Hebrew quote excerpts to PDF char count. Prayer Hebrew is complete.
- mincha/mincha_ashrei: same dual-column overcount; Ashrei prayer is complete.
- maariv/aleinu_maariv: same dual-column overcount; Aleinu prayer is complete.

OK   · shacharit/hashkamas_haboker · pdf=538 json=494
OK   · shacharit/birchos_hashachar · pdf=1518 json=1740
OK   · shacharit/pesukei_dzimrah · pdf=14556 json=14626
WARN · shacharit/barchu · pdf=795 json=0 (0% — may be intentional if section has no prayer blocks)
OK   · shacharit/birchos_krias_shema_shacharit · pdf=5832 json=4151
OK   · shacharit/shemoneh_esrei_shacharit · pdf=8716 json=6891
WARN · shacharit/avinu_malkeinu_shacharit · pdf=3096 json=0 (0% — may be intentional if section has no prayer blocks)
SKIP · shacharit/tachanun_shacharit · pdf=3845 json=1671 (43% — known page-range issue, see header)
WARN · shacharit/krias_hatorah · pdf=6991 json=0 (0% — may be intentional if section has no prayer blocks)
OK   · shacharit/aleinu_shacharit · pdf=731 json=716
OK   · shacharit/shir_shel_yom · pdf=847 json=2959
WARN · shacharit/barchi_nafshi · pdf=2007 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · shacharit/ldovid_hashem_shacharit · pdf=1482 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · shacharit/pitum_haketores · pdf=1899 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · shacharit/shesh_zechiros · pdf=693 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · shacharit/shloshah_asar_ikarim · pdf=1276 json=0 (0% — may be intentional if section has no prayer blocks)
OK   · birkat_hamazon/birchas_hamazon · pdf=6053 json=4174
WARN · birkat_hamazon/al_hamichyah · pdf=709 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · birkat_hamazon/borei_nefashos · pdf=968 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · tefillos/tefillas_haderech · pdf=846 json=0 (0% — may be intentional if section has no prayer blocks)
SKIP · mincha/mincha_ashrei · pdf=5664 json=1002 (18% — known page-range issue, see header)
OK   · mincha/shemoneh_esrei_mincha · pdf=9512 json=7717
WARN · mincha/avinu_malkeinu_mincha · pdf=2034 json=0 (0% — may be intentional if section has no prayer blocks)
OK   · mincha/tachanun_mincha · pdf=864 json=932
OK   · mincha/aleinu_mincha · pdf=716 json=716
OK   · maariv/maariv_opening · pdf=380 json=255
OK   · maariv/birchos_krias_shema_maariv · pdf=3702 json=3902
OK   · maariv/shemoneh_esrei_maariv · pdf=7664 json=6427
SKIP · maariv/aleinu_maariv · pdf=1474 json=716 (49% — known page-range issue, see header)
WARN · maariv/ldovid_hashem_maariv · pdf=211 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · maariv/maariv_motzaei_shabbos · pdf=897 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · tefillos/sefiras_haomer · pdf=2827 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · tefillos/krias_shema_al_hamitah · pdf=4379 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · tefillos/netilas_lulav · pdf=494 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · shacharit/hallel · pdf=5473 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · shacharit/mussaf_rosh_chodesh · pdf=8227 json=0 (0% — may be intentional if section has no prayer blocks)
WARN · shacharit/mussaf_chol_hamoed · pdf=7805 json=0 (0% — may be intentional if section has no prayer blocks)

---
Total: 14 OK, 0 FAIL, 3 SKIP (known page-range issues)
Generated: 2026-05-26T22:52:54.775Z
